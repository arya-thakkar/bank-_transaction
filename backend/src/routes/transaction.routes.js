const { Router } = require("express");
const {
  authMiddleware,
  authSystemMiddleware,
} = require("../middleware/auth.middleware");
const {
  createTransaction,
  createInitialFundsTransaction,
} = require("../controllers/transaction.controllers");

const router = Router();

router.post("/", authMiddleware, createTransaction);
router.post(
  "/system/initial-funds",
  authSystemMiddleware,
  createInitialFundsTransaction,
);

module.exports = router;
