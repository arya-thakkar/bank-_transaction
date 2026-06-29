const express = require("express");
const {
  userRegister,
  verifyOTP,
  resendOTP,
  userLogin,
  userLogout,
} = require("../controllers/auth.controllers");

const router = express.Router();

router.post("/register", userRegister);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", userLogin);
router.post("/logout", userLogout);

module.exports = router;
