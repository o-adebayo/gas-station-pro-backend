const mongoose = require("mongoose");

const tokenSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  token: {
    // this was initially used for my password reset token and changed to start using rtoken instead
    type: String,
    default: "",
  },
  aToken: {
    //account activation token (same as vToken in video)
    type: String,
    default: "",
  },
  rToken: {
    // password reset token
    type: String,
    default: "",
  },
  lToken: {
    //login token when we trigger 2FA
    type: String,
    default: "",
  },
  dToken: {
    //delete token for managers
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
