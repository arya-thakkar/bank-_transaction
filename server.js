require('dotenv').config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

connectDB().then(() => {
    app.listen(5000, () => {
        console.log("Server is running");
    });
});