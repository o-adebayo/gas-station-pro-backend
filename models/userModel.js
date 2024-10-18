const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    companyCode: {
      type: String,
      required: true,
    }, // Company unique code the user is connected to
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: true,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password must be up to 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "manager", "user", "super-admin"],
      default: "manager",
    }, // Default role is manager
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store", // Reference to the Store model
      default: null, // Admins will not have a storeId; only managers will
    },
    phone: {
      type: String,
      default: "+234",
    },
    description: {
      type: String,
    },
    photo: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      default: "inactive", // Default status
    },
    userAgent: {
      type: Array,
      required: true,
      default: [], // this is to save all browsers the user has used
    },
    activationToken: {
      type: String, // To store the activation token
    },
    activationTokenExpires: {
      type: Date, // To store the expiration date of the activation token
    },
  },
  { timestamps: true }
);

// Encrypt Password before saving to the DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

// Convert role to lowercase before saving to the DB
userSchema.pre("save", function (next) {
  if (this.role) {
    this.role = this.role.toLowerCase();
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
