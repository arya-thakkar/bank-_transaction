const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const emailService = require("../services/email.services");
const tokenBlacklistModel = require("../models/blacklist.models");
const { accountModel } = require("../models/account.models");


// Generates a cryptographically random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}



async function userRegister(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const isExists = await userModel.findOne({ email });

  if (isExists) {
    // If user exists but is not yet verified, resend a fresh OTP
    if (!isExists.isVerified) {
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 8);
      isExists.otp = otpHash;
      isExists.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await isExists.save();
      // Fire email in background — don't block the response
      emailService.sendOTPEmail(email, isExists.name, otp).catch((e) =>
        console.error("OTP resend email failed:", e.message)
      );
      return res.status(200).json({
        message: "OTP resent. Please verify your email.",
        email,
      });
    }

    return res.status(422).json({
      message: "User already exists with this email.",
      status: "failed",
    });
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 8);

  const user = await userModel.create({
    email,
    password,
    name,
    otp: otpHash,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    isVerified: false,
  });

  // Respond immediately so the OTP page opens without delay
  res.status(201).json({
    message: "Registration successful. Please check your email for the OTP to verify your account.",
    email,
  });

  // Send OTP email in the background after responding
  emailService.sendOTPEmail(email, name, otp).catch((e) =>
    console.error("OTP email failed:", e.message)
  );
}


async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "email and otp are required" });
  }

  const user = await userModel
    .findOne({ email })
    .select("+otp +otpExpiresAt +systemUser");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Email is already verified. Please login." });
  }

  // Check if OTP has expired
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return res.status(400).json({
      message: "OTP has expired. Please request a new one.",
    });
  }

  // Verify the OTP against the stored hash
  const isValidOTP = await bcrypt.compare(otp, user.otp);

  if (!isValidOTP) {
    return res.status(400).json({ message: "Invalid OTP. Please try again." });
  }

  // Mark user as verified and clear OTP fields
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  // Automatically create a bank account for the newly verified user
  await accountModel.create({ user: user._id });

  // Issue a JWT so they are immediately logged in
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  // Send the welcome email in the background (non-critical)
  emailService.sendRegistrationEmail(user.email, user.name).catch(console.error);

  return res.status(200).json({
    message: "Email verified successfully. Welcome to NexusBank!",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}


async function resendOTP(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  const user = await userModel.findOne({ email }).select("+otp +otpExpiresAt");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Email is already verified." });
  }

  // Throttle: only allow resend if at least 1 minute has passed
  if (user.otpExpiresAt && user.otpExpiresAt > new Date(Date.now() + 9 * 60 * 1000)) {
    return res.status(429).json({
      message: "Please wait a moment before requesting a new OTP.",
    });
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 8);
  user.otp = otpHash;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await emailService.sendOTPEmail(email, user.name, otp);
  } catch (emailError) {
    console.error("Failed to resend OTP email:", emailError);
    return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
  }

  return res.status(200).json({
    message: "A new OTP has been sent to your email.",
  });
}


async function userLogin(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Email or password is invalid" });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({ message: "Email or password is invalid" });
  }

  // Prevent unverified users from logging in — send them a fresh OTP
  if (!user.isVerified) {
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 8);
    user.otp = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await emailService.sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      console.error("Failed to send verification OTP:", emailError);
    }

    return res.status(403).json({
      message: "Your email is not verified. A new OTP has been sent to your email.",
      email: user.email,
      requiresVerification: true,
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}


async function userLogout(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "User is not logged in" });
  }

  await tokenBlacklistModel.create({ token });
  res.clearCookie("token");

  return res.status(200).json({ message: "Logged out successfully" });
}

module.exports = { userRegister, verifyOTP, resendOTP, userLogin, userLogout };
