const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const {
  createAccount,
  getUserAccount,
  getAccountBalance,
} = require("../controllers/account.controllers");

const router = express.Router();

router.post("/", authMiddleware, createAccount);
router.get("/", authMiddleware, getUserAccount);

router.get("/balance/:accountId", authMiddleware, getAccountBalance);

module.exports = router;
