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
  console.log(`New client connected: ${socket.id}`);

    socket.onAny((event, data) => {
        console.log(`📨 Incoming Event: ${event}`, data);
    });

  // Leave room on disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Clean up user from all rooms
    for(const [roomId, users] of Object.entries(roomUsers)) {
        if(users.has(socket.user._id.toString())) {
            users.delete(socket.user._id.toString());

            // Notify others
            io.to(roomId).emit('room-users', Array.from(users));
        }
    }
  });

  // Join a recipe room for collaborative editing
  socket.on('join-recipe', (data) =>{
    const recipeId = typeof data === 'object' ? data.recipeId || data : data;
    socket.join(recipeId);

    // Add user to roomUsers.
    if(!roomUsers[recipeId]){
        roomUsers[recipeId] = new Set();
    }

    roomUsers[recipeId].add(socket.user._id.toString());
    console.log(`🧑‍🍳 User ${socket.user.email} joined room ${recipeId}`);

    io.to(recipeId).emit('room-users', Array.from(roomUsers[recipeId]));
  });

  // Broadcast steps/timer updates in cooking mode
  socket.on('cooking-step', ({ recipeId, step }) => {

    if(socket.user.role !== 'chef'){
        return socket.emit('error', 'Only chefs can broadcast steps');
    }

    console.log(`👨‍🍳 ${socket.user.email} broadcasted: ${step} in recipe ${recipeId}`);


    socket.to(recipeId).emit('step-update', {
        step,
        by: socket.user.email,
        at: new Date().toISOString()
    });
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