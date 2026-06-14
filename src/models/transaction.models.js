const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, 'Transaction must be associated with a "from" account'],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, 'Transaction must be associated with a "to" account'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "reversed"],
        message: "status can be either pending,completed,failed or reversed",
      },
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "amount is required for creating a transaction"],
      min: [0, "transaction amount can't be negative"],
    },
    idempotencyKey: {
      type: String,
      required: [
        true,
        "idempotency key is required for creating a transaction",
      ],
      index: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;


