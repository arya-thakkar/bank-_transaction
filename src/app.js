const express = require("express");
const cookiePraser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/accounts.routes")
const transactionRoutes = require("./routes/transaction.routes")


const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins for the pitch presentation
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookiePraser());


app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);





app.get("/", (req, res) => {
    res.send("Server Working");
});

module.exports = app;
