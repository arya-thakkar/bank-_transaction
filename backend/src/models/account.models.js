const mongoose = require("mongoose");
const {ledgerModel} = require("./ledger.models");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "account must be associated with a user"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "frozen", "closed"],
        message: "status can be either active,frozen or closed",
      },
      default: "active",
    },
    currency: {
      type: String,
      required: [true, "currency is required for creating an accounnt"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$otalCredit", "$totalDebit"] },
      },
    },
  ]);

  if (balanceData.length === 0) {
    return 0;
  }
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = {
  accountModel,
};
