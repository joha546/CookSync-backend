const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');       // Added for custom Server. 
const {Server} = require('socket.io');


const connectDB = require('./config/db');
const recipeRouts = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes')

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

// Socket.IO real-time features
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

    socket.onAny((event, data) => {
        console.log(`📨 Incoming Event: ${event}`, data);
    });

  // Leave room on disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Join a recipe room for collaborative editing
  socket.on('join-recipe', (data) => {

    console.log('🧾 join-recipe received data:', data);

    const recipeId = typeof data === 'object' ? data.recipeId || data : data;
    socket.join(recipeId);
    console.log(`🧑‍🍳 Socket ${socket.id} joined room ${recipeId}`);
  });

  // Broadcast steps/timer updates in cooking mode
  socket.on('cooking-step', ({ recipeId, step }) => {
    socket.to(recipeId).emit('step-update', step);
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