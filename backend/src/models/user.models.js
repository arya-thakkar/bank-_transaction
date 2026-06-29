const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating user"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
      unique: [true, "Email already exist"],
    },
    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },
    password: {
      type: String,
      required: [true, "password is required for creating an account"],
      minlength: [6, "password should contain atleast 6 characters"],
      select: false,
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  // If password was not changed, skip hashing
  if (!this.isModified("password")) {
    return;
  }
  const hash = await bcrypt.hash(this.password, 8);
  this.password = hash;
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
