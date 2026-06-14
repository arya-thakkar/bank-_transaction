const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Server is connected to DB');
    } catch (err) {
        console.error('Error connecting to DB', err);
        process.exit(1);
    }
};

module.exports = connectDB;