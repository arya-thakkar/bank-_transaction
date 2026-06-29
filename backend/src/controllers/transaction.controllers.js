const transactionModel = require("../models/transaction.models");
const { ledgerModel } = require("../models/ledger.models");
const {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
} = require("../services/email.services");
const { accountModel } = require("../models/account.models");
const mongoose = require("mongoose");

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount,toAccount,amount and idempotencyKey are required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "invalid toAccount or fromAccount",
    });
  }

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "completed") {
      return res.status(200).json({
        message: "transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "pending") {
      return res.status(200).json({
        message: "transaction is still processing",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "failed") {
      return res.status(500).json({
        message: "transaction processing failed,please retry",
      });
    }

    if (isTransactionAlreadyExists.status === "reversed") {
      return res.status(500).json({
        message: "transaction was reversed,please retry",
        transaction: isTransactionAlreadyExists,
      });
    }
  }

  if (
    fromUserAccount.status !== "active" ||
    toUserAccount.status !== "active"
  ) {
    return res.status(400).json({
      message:
        "both fromAccount and toAccount must be active to process transaction",
    });
  }

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    res.status(400).json({
      message: `insufficient balamce. current balance is ${balance}. requested amount is ${amount}`,
    });
  }
  let transaction;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "pending",
        },
      ],
      { session },
    );

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "debit",
        },
      ],
      { session },
    );

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "credit",
        },
      ],
      { session },
    );

    transaction.status = "completed";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message:
        "transaction is pending due to some issue, please retry after sometime",
    });
  }
  await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

  return res.status(201).json({
    message: "transaction completed successfully",
    transaction: transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount,amount and idempotencyKey are required",
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(400).json({
      message: "invalid toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "system user account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = (
    await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "pending",
        },
      ],
      { session },
    )
  )[0];

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "debit",
      },
    ],
    { session },
  );

  await (() => {
    return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
  });

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "credit",
      },
    ],
    { session },
  );

  transaction.status = "completed";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "initial funds transaction completed successfully",
    transaction: transaction,
  });
}

module.exports = { createTransaction, createInitialFundsTransaction };
