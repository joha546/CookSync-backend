const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');


const connectDB = require('./config/db');

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

const PORT = process.env.PORT || 8000;


app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
})