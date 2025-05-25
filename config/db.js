const mongoose = require('mongoose');

const connectDB = async() => {
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected: ${connect.connection.host}, ${connect.connection.name} `)
    }
    catch(error){
        console.log("DB connection error: ", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;