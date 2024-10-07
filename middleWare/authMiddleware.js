const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const protect = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res
          .status(401)
          .json({ message: "Not authorized, please login" });
      }

      // Verify Token
      const verified = jwt.verify(token, process.env.JWT_SECRET);

      // Get user id from token and exclude the password field
      const user = await User.findById(verified.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // check if the user's status is inactive
      if (user.status === "inactive") {
        res.status(400);
        throw new Error(
          "Account is inactive, please reach out to your Admin or contact Support."
        );
      }

      // Check if user's role matches the allowed roles
      if (roles.length && !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Unauthorized, insufficient permissions" });
      }

      req.user = user; // this means we have access to the req.user anywhere or any page we apply the protect on. see userRoute for those pages
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, please login" });
    }
  });
};

// if we wanted to create a specific middleware for admin only (this is same a doing protect[admin])
const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Unauthorized, insufficient permission");
  }
};

// if we wanted to create a specific middleware for manager only (this is same a doing protect[manager])
const managerOnly = async (req, res, next) => {
  if (req.user.role === "manager" || req.user.role === "manager") {
    //this is because admin can do anything a manager can
    next();
  } else {
    res.status(401);
    throw new Error("Unauthorized, insufficient permission");
  }
};

// if we wanted to create a specific middleware for active users only
const activeOnly = async (req, res, next) => {
  if (req.user && req.user.status === "active") {
    //this is because admin can do anything a manager can
    next();
  } else {
    res.status(401);
    throw new Error("Unauthorized, account is inactive");
  }
};

module.exports = protect;
