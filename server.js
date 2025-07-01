const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');       // Added for custom Server. 
const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');


const connectDB = require('./config/db');
const recipeRouts = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');
const CookingSession = require('./models/CookingSession');
const cookingRoutes = require('./routes/cookingRoutes');
const handleChatEvents = require('./sockets/chat');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Recipe = require('./models/Recipe');
const Notification = require('./models/Notification');

// In memory map for roomUsers
const roomUsers = {};

// connecting to the database.
dotenv.config();
connectDB();

// creating app instance.
const app = express();

// middlewares.
app.use(cors());
app.use(express.json());

// Basic health route.
app.get('/api/health', (req, res) => {
    res.json({message: 'API is running.'});
})

// routes.
app.use('/api/recipes', recipeRouts);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cooking', cookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// SetUp Socket.IO Server.
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',     // In production, we need to change it.
        methods: ['GET', 'POST']
    }
});

// Make io accessible in all controllers.
app.set('io', io);

// Socket Authentication and authorization.
io.use(async(socket, next) => {
    
    const token = socket.handshake.auth?.token;

    if(!token){
        return next(new Error('Authentication error: Token missing'));
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if(!user){
            return next(new Error('Authentication Error: User not found'));
        }

        socket.user = user;    // attach user to socket
 
      next();
    }

    catch (err) {
        console.error('Socket auth error:', err.message);
        return next(new Error('Authentication error: Invalid token'));
    }
})


// Socket.IO real-time features
io.on('connection', (socket) => {

  // handle chat events.
  handleChatEvents(io, socket);

  console.log(`New client connected: ${socket.id}`);

    socket.onAny((event, data) => {
        console.log(`📨 Incoming Event: ${event}`, data);
    });

  // Leave room on disconnect
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Loop through all rooms and remove user from each
    for(const [roomId, users] of Object.entries(roomUsers)){
      if(users.has(socket.user._id.toString())){
        users.delete(socket.user._id.toString());

        // Notify remaining users in room
        io.to(roomId).emit('room-users', Array.from(users));

        // Notify recipe owner if someone left their room
        try{
          const recipe = await Recipe.findById(roomId).populate('chefId', 'email');

          if(!recipe || !recipe.chefId) continue;

          // Skip notification if chef is the one who disconnected
          if(recipe.chefId._id.toString() === socket.user._id.toString()) continue;

          const notif = await Notification.create({
            user: recipe.chefId._id,
            message: `${socket.user.email} left your recipe room "${recipe.title}"`,
            link: `/recipes/${roomId}`,
            type: 'leave-room'
          });

          const sockets = await io.fetchSockets();
          sockets.forEach(sock => {
            if(sock.user && sock.user._id.toString() === recipe.chefId._id.toString()){
              sock.emit('new-notification',{
                type: 'leave-room',
                message: notif.message,
                link: notif.link,
                createdAt: notif.createdAt
              });
            }
          });
        } 
        catch (err) {
          console.error('❌ disconnect notification error:', err.message);
        }
      }
    }
  });


  // Join a recipe room for collaborative editing
  socket.on('join-recipe', async(data) =>{
    const recipeId = typeof data === 'object' ? data.recipeId || data : data;
    socket.join(recipeId);

    // Add user to roomUsers.
    if(!roomUsers[recipeId]){
        roomUsers[recipeId] = new Set();
    }

    roomUsers[recipeId].add(socket.user._id.toString());
    console.log(`🧑‍🍳 User ${socket.user.email} joined room ${recipeId}`);

    io.to(recipeId).emit('room-users', Array.from(roomUsers[recipeId]));

    // Notify recipe owner.
    try{
      const recipe = await Recipe.findById((recipeId).populate('chefId', 'email'));

      if(!recipe || !recipe.chefId){
        return;
      }

      if(recipe.chefId._id.toString() !== socket.user._id.toString()){
        const notif = await Notification.create({
          user: recipe.chefId._id,
          message: `${socket.user.email} joined your recipe room "${recipe.title}"`,
          link: `/recipes/${recipeId}`,
          type: 'join-room'
        });

        // Emit to owner if online.
        const sockets = await io.fetchSockets();
        sockets.forEach(sock => {
          if(sock.user && sock.user._id.toString() === recipe.chefId._id.toString()) {
            sock.emit('new-notification', {
              type: 'join-room',
              message: notif.message,
              link: notif.link,
              createdAt: notif.createdAt
            });
          }
        });
      }
    }
    catch(error){
      console.error('❌ join-recipe notification error:', error.message);
    }
  });

  // Broadcast steps/timer updates in cooking mode
  socket.on('cooking-step', async({ recipeId, step }) => {

    if(socket.user.role !== 'chef'){
        return socket.emit('error', 'Only chefs can broadcast steps');
    }

    console.log(`👨‍🍳 ${socket.user.email} broadcasted: ${step} in recipe ${recipeId}`);

    const session = new CookingSession({
      recipeId,
      userId: socket.user._id,
      step
    });

    try{
      await session.save();
      console.log(`📥 Step saved: ${step} by ${socket.user.email}`);

      socket.to(recipeId).emit('step-update', {
          step,
          by: socket.user.email,
          at: new Date().toISOString()
      });
    }
    catch(error){
      console.error('Failed to save step: ', error.message);
      socket.emit('error', 'Step not saved');
    }
  });

  // Fallback for Postman or clients sending { event, data }
  socket.on('message', ({ event, data }) => {
    console.log(`📬 Wrapped Event: ${event}`, data);

    if (event === 'join-recipe') {
      const recipeId = typeof data === 'object' ? data.recipeId || data : data;
      socket.join(recipeId);
      console.log(`🧑‍🍳 Socket ${socket.id} joined room ${recipeId} (via message)`);
    }

    if (event === 'cooking-step') {
      socket.to(data.recipeId).emit('step-update', data.step);
      console.log(`🔥 Step update sent to ${data.recipeId} (via message): ${data.step}`);
    }
  });

});


const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server running with Socket.IO at port ${PORT}`);
})