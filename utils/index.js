const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// this will hold all our small utility functions
// that we can use in multiple places

// Function to Generate Token with the id of the user
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Hash Token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

//export so we cna use in all of our application
module.exports = {
  generateToken,
  hashToken,
};
