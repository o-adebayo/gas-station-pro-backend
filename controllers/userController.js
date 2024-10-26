const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Store = require("../models/storeModel");
const Company = require("../models/companyModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { generateToken, hashToken } = require("../utils");
var parser = require("ua-parser-js");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.CRYPTR_KEY);
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");

// Register a User from the regular register account page (this requires comp code and password at the start)
const registerUser = asyncHandler(async (req, res) => {
  const { companyCode, name, email, role, storeId, phone, password, photo } =
    req.body;

  // Validation
  if (!companyCode || !name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all the required fields");
  }

  if (password.length < 6) {
    registerUser.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if the companyCode exists in the Company model
  const companyExists = await Company.findOne({ companyCode });
  if (!companyExists) {
    res.status(400);
    throw new Error(
      "Company code does not exist. Please contact the company owner or our sales team."
    );
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already in use");
  }

  // Check if the registering email matches the company owner's email
  let userRole = "manager"; // Default role is manager
  if (email === companyExists.ownerEmail) {
    userRole = "admin"; // Set role to admin if email matches the company owner's email
  }

  // Generate a random password. no longer needed
  //const randomPassword = crypto.randomBytes(8).toString("hex");

  // Convert storeId to ObjectId if provided
  let storeObjectId = null;
  if (storeId) {
    storeObjectId = new mongoose.Types.ObjectId(storeId);
  }

  // Get UserAgent
  const ua = parser(req.headers["user-agent"]);
  const userAgent = [ua.ua];

  // Create new user with generated password, inactive status, and no login yet
  const user = await User.create({
    companyCode,
    name,
    email,
    password,
    role: userRole, // Set role based on the check
    storeId: storeObjectId,
    phone,
    photo,
    status: "inactive", // Set user as inactive by default
    userAgent,
  });

  //if we were going to generate token that allows the user to login immediately
  //we woulds have dont it here but we are not doing this since users must activate account first
  //const token = generateToken(user._id);

  // Generate activation token and link
  const activationToken = crypto.randomBytes(20).toString("hex");
  const hashedactivationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");

  //const activationLink = `${process.env.FRONTEND_URL}/activate/${hashedactivationToken}`;
  // We should send the unhashed token and then we will hash it when we recieve it
  const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

  // Save activation token and expiry in the user record
  // We We wills save the hashed token into the database
  user.activationToken = hashedactivationToken;
  user.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
  await user.save();

  const subject = "Welcome to Gas Station Pro, Activate Your Account Now 🚀";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = process.env.REPLY_TO_EMAIL;
  const template = "activateEmail"; // Name of the Handlebars template (without extension)
  const link = activationLink;

  // Send activation email
  // the order must match the order we defined in util index.js
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link,
      companyCode,
      "",
      ""
    );
    res.status(201).json({
      message:
        "User created successfully. Please check your email to activate your account.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }

  // If user creation is successful, return user details without logging them in
  if (user) {
    const { _id, companyCode, name, email, role, storeId, phone, photo } = user;
    res.status(201).json({
      _id,
      companyCode,
      name,
      email,
      role,
      storeId,
      phone,
      photo,
      message:
        "User created successfully. Please check email to activate your account.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Create the activation email message
/*  const message = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
    <div style="text-align: center;">
      <img src="https://example.com/logo.png" alt="Gas Station Pro Logo" style="width: 150px; margin-bottom: 20px;" />
    </div>
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
      <h2 style="color: #333;">Welcome to Gas Station Pro, ${user.name}!</h2>
      
      <p style="color: #555;">We’re thrilled to have you join us! Gas Station Pro is here to make managing your gas station simple and efficient, with everything you need at your fingertips. You can easily keep track of daily sales, manage operations, and stay on top of everything that matters for smooth operations.</p>
      
      <h3 style="color: #333;">Benefits of Using Gas Station Pro:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>Manage daily sales reports and track performance.</li>
        <li>Gain access to all your station data from anywhere, anytime.</li>
        <li>Enjoy seamless collaboration with your team and the company owner.</li>
      </ul>
      
      <p style="color: #555;">To get started, please activate your account by clicking the button below. This activation link will only be valid for the next <strong>24 hours</strong>.</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${activationLink}" clicktracking=off>${activationLink} style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">Activate Account</a>
      </div>

      <p style="color: #555;">Alternatively, you can click on the link below to activate your account:</p>
      <p><a href="${activationLink}" clicktracking=off>${activationLink} style="color: #007bff;">${activationLink}</a></p>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 0.9rem; color: #777;">If you have any questions or need help, please reach out to our support team at <a href="mailto:support@gasstationpro.com" style="color: #007bff;">support@gasstationpro.com</a>. We're here to help you get the most out of Gas Station Pro!</p>

      <p style="color: #333;">Welcome aboard,<br><strong>The Gas Station Pro Team</strong></p>
    </div>
  </div>
`;

  const subject = "Welcome to Gas Station Pro, Activate Your Account Now 🚀";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  // Send activation email
  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(201).json({
      message:
        "User created successfully. Please check your email to activate your account.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }

  // If user creation is successful, return user details without logging them in
  if (user) {
    const { _id, companyCode, name, email, role, storeId, phone, photo } = user;
    res.status(201).json({
      _id,
      companyCode,
      name,
      email,
      role,
      storeId,
      phone,
      photo,
      message:
        "User created successfully. Please check email to activate your account.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
}); */

// Register User Added by Admin
const registerUserAddedByAdmin = asyncHandler(async (req, res) => {
  const { name, email, role, storeName, phone, photo } = req.body;

  // Retrieve the admin user's company code from the authenticated user
  const companyCode = req.user.companyCode;

  // Validation
  if (!companyCode || !name || !email) {
    res.status(400);
    throw new Error("Please fill in all the required fields");
  }

  // Check if the companyCode exists in the Company model
  // Retrieve the company information using the companyCode
  const company = await Company.findOne({ companyCode });
  if (!company) {
    res.status(404);
    throw new Error(
      "Company not found. Please contact the company owner or our sales team.."
    );
  }

  const companyName = company.name; // Get the company name from the Company model

  // Check if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already in use");
  }

  // Check if the provided store name exists and belongs to the admin's company
  let storeObjectId = null;
  if (storeName) {
    const storeExists = await Store.findOne({ name: storeName, companyCode });
    if (!storeExists) {
      res.status(400);
      throw new Error(
        "The selected store name does not exist or does not belong to your company"
      );
    }
    storeObjectId = storeExists._id;
  }

  // Handle Image upload
  // this is now done from the frontend
  let fileData = {};
  if (req.file) {
    // Construct the folder path dynamically based on the company name and store name
    const folderPath = `Gas Station Pro/Companies/${companyName}/Users/${name}`;

    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath, // Use the dynamically generated folder path
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // No need to add user agent because it will be the Admin's user agent which would be incorrect

  // Generate a random password
  const randomPassword = crypto.randomBytes(8).toString("hex");

  // Create new user with generated password, inactive status, and no login yet
  const user = await User.create({
    companyCode,
    name,
    email,
    password: randomPassword,
    role, // Use the role selected by the admin
    storeId: storeObjectId,
    phone,
    //photo,
    photo: fileData,
    status: "inactive", // Set user as inactive by default
  });

  // Generate activation token and link
  const activationToken = crypto.randomBytes(20).toString("hex");
  const hashedactivationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");

  //const activationLink = `${process.env.FRONTEND_URL}/activateaddedbyadmin/${hashedactivationToken}`;
  const activationLink = `${process.env.FRONTEND_URL}/activateaddedbyadmin/${activationToken}`;

  // Save activation token and expiry in the user record
  // We will save the hashed activation token to the DB
  user.activationToken = hashedactivationToken;
  user.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
  await user.save();

  // Update the store with the managerId (user's _id) if storeId exists
  if (storeObjectId) {
    await Store.findByIdAndUpdate(storeObjectId, { managerId: user._id });
  }

  // prepare all the values we need to send the email
  const subject = "Your Admin Has Created an Account for You, Activate Now 🚀";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = process.env.REPLY_TO_EMAIL;
  const template = "activationAddedByAdminEmail"; // Name of the Handlebars template (without extension)
  const link = activationLink;

  // Send activation email
  // the order must match the order we defined in util index.js
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link,
      companyCode,
      "",
      ""
    );
    res.status(201).json({
      message:
        "User created successfully. Please check your email to activate your account.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }

  // If user creation is successful, return user details without logging them in
  if (user) {
    const { _id, companyCode, name, email, role, storeId, phone, photo } = user;
    res.status(201).json({
      _id,
      companyCode,
      name,
      email,
      role,
      storeId,
      phone,
      photo,
      message:
        "User created successfully. Please advise the user to check their email to activate.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Create the activation email message
/*   const message = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
    <div style="text-align: center;">
      <img src="https://example.com/logo.png" alt="Gas Station Pro Logo" style="width: 150px; margin-bottom: 20px;" />
    </div>
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
      <h2 style="color: #333;">Welcome to Gas Station Pro, ${user.name}!</h2>
      
      <p style="color: #555;">Your company admin has created an account for you on Gas Station Pro, the platform that makes managing gas stations simple and efficient.</p>
      
      <h3 style="color: #333;">To get started:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>Click the link below to activate your account and set a new password.</li>
        <li>This activation link will only be valid for the next <strong>24 hours</strong>.</li>
      </ul>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${activationLink}" clicktracking=off style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">Activate Account</a>
      </div>

      <p style="color: #555;">Alternatively, you can click on the link below to activate your account:</p>
      <p><a href="${activationLink}" clicktracking=off style="color: #007bff;">${activationLink}</a></p>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 0.9rem; color: #777;">If you have any questions or need help, please reach out to our support team at <a href="mailto:support@gasstationpro.com" style="color: #007bff;">support@gasstationpro.com</a>. We're here to help you get the most out of Gas Station Pro!</p>

      <p style="color: #333;">Welcome aboard,<br><strong>The Gas Station Pro Team</strong></p>
    </div>
  </div>
  `;

  const subject = "Your Admin Has Created an Account for You, Activate Now 🚀";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  // Send activation email
  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(201).json({
      message:
        "User created successfully by the admin. Please advise the user to check their email to activate.",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }

  // If user creation is successful, return user details without logging them in
  if (user) {
    const { _id, companyCode, name, email, role, storeId, phone, photo } = user;
    res.status(201).json({
      _id,
      companyCode,
      name,
      email,
      role,
      storeId,
      phone,
      photo,
      message:
        "User created successfully. Please advise the user to check their email to activate.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});
 */

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if the user exists in the DB
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error(
      "User not found, please reach out to your store admin or contact our Sales department to sign up"
    );
  }

  // User exists, Check if the password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (!passwordIsCorrect) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  // Check if the user's account is active
  if (user.status !== "active") {
    res.status(403); // Forbidden status
    throw new Error(
      "Your account is inactive. If this is your first time logging in, please ensure you have activated your account. If this is not the first time, please contact your company owner or admin."
    );
  }

  // Get UserAgent
  const ua = parser(req.headers["user-agent"]);
  const thisUserAgent = ua.ua; // this is the current device they are using

  // Trigger 2FA for unknown UserAgent if the userAgent array is not empty
  // this is because we sent set user agent on register if it was registered by Admin
  if (user.userAgent.length > 0 && !user.userAgent.includes(thisUserAgent)) {
    // Generate 6 digit code
    const loginCode = Math.floor(100000 + Math.random() * 900000);
    console.log(loginCode);

    // Encrypt the loginCode before saving it to DB
    const encryptedLoginCode = cryptr.encrypt(loginCode.toString());

    // Delete token if it exists in DB
    let userToken = await Token.findOne({ userId: user._id });
    if (userToken) {
      await userToken.deleteOne();
    }

    // Save Token to DB
    await new Token({
      userId: user._id,
      lToken: encryptedLoginCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // Thirty minutes
    }).save();

    res.status(400);
    throw new Error("Unrecognized device or browser detected");
  }

  // Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  if (passwordIsCorrect) {
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    // Return user details upon successful login
    const { _id, companyCode, name, email, role, storeId, phone, photo } = user;
    res.status(200).json({
      _id,
      companyCode,
      name,
      email,
      role,
      storeId,
      phone,
      photo,
      token,
    });
  } else {
    res.status(500);
    throw new Error("Something went wrong, please try again");
  }
});

// Function to send Login code to user when 2FA is triggered
// Send Login Code via email
const sendLoginCode = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const user = await User.findOne({ email });

  // Check if user is not found
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Find the Login Code for the user in the DB
  let userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired token, please login again");
  }

  // Decrypt the login code to send to the user
  const loginCode = userToken.lToken;
  const decryptedLoginCode = cryptr.decrypt(loginCode);

  // Prepare the email details
  const subject = "Your Gas Station Pro Login Access Code 🚀";
  const send_to = email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = process.env.REPLY_TO_EMAIL;
  const template = "twoFactorAuthEmail"; // The Handlebars template file name without extension
  const name = user.name;
  link = decryptedLoginCode;

  // Send the login code email
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name, // Name for personalization
      link, // we used the link variable for login code here
      null, // Link is not needed here
      null,
      null
    );
    res.status(200).json({ message: `Login access code sent to ${email}` });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Login with Access Code
const loginWithCode = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { loginCode } = req.body;

  const user = await User.findOne({ email });

  // Check if user is not found
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Find the Login Code for the user in the DB
  const userToken = await Token.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired token, please login again");
  }

  // Decrypt the encrypted login code that we have in our DB
  const decryptedLoginCode = cryptr.decrypt(userToken.lToken);

  // Now compare the decrypted token with the loginCOde that the user entered
  if (loginCode !== decryptedLoginCode) {
    res.status(400);
    throw new Error("Incorrect login access code, please try again");
  } else {
    // add the new UserAgent into the allowed list in the DB then log the user in
    // Get UserAgent
    const ua = parser(req.headers["user-agent"]);
    const thisUserAgent = ua.ua; // this is the current device they are using
    user.userAgent.push(thisUserAgent); //add the new user agent to the array of userAgents i.e. allowed user agents for the user

    await user.save();

    // Since thje access code is correct, lets generate token, cookie and just automatically log the user in
    // Generate Token
    const token = generateToken(user._id);

    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    const {
      _id,
      name,
      email,
      companyCode,
      phone,
      storeId,
      photo,
      role,
      status,
    } = user;

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      companyCode,
      photo,
      role,
      status,
      storeId,
    });
  }
});

// Function to send Delete code to managers
// Send Login Code via email
const sendReportDeleteCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  // Check if the user is not found
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if the user has a 'manager' role (delete code can only be sent to managers)
  if (user.role !== "manager") {
    res.status(403); // Forbidden status code
    throw new Error("Delete code can only be sent to managers.");
  }

  // Generate a new delete code (6-digit random number)
  const deleteCode = Math.floor(100000 + Math.random() * 900000).toString();
  //console.log(deleteCode);

  // Encrypt the delete code before storing it in the database
  const encryptedDeleteCode = cryptr.encrypt(deleteCode);

  // Set expiration time to 30 minutes from now
  const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes in milliseconds

  // Save the new token (delete code) to the Token collection for this user
  const userToken = await Token.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      dToken: encryptedDeleteCode,
      createdAt: Date.now(),
      expiresAt: expirationTime,
    },
    { upsert: true, new: true }
  );

  // Prepare the email details
  const subject = "Your Gas Station Pro One-time Report Delete Code 🚀";
  const send_to = email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = process.env.REPLY_TO_EMAIL;
  const template = "reportDeleteCodeEmail"; // The Handlebars template file name without extension
  const name = user.name;
  const link = deleteCode; // Use the plain delete code in the email body

  // Send the delete code email
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name, // Name for personalization
      link, // The delete code will be sent here
      null, // No additional link needed
      null,
      null
    );
    res.status(200).json({ message: `Delete code sent to ${email}` });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), // right away
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

/// Get User Data
const getUser = asyncHandler(async (req, res) => {
  //console.log("Fetching user data for:", req.user._id); // Debugging log

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const {
        _id,
        companyCode,
        name,
        email,
        role,
        storeId,
        photo,
        phone,
        userAgent,
      } = user;
      res.status(200).json({
        _id,
        companyCode,
        name,
        email,
        role,
        storeId,
        phone,
        userAgent,
        photo,
      });
    } else {
      res.status(404);
      throw new Error("User Not Found");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Users
const getUsers = asyncHandler(async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    if (!requestingUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const { role, companyCode, storeId } = requestingUser;

    let users;

    if (role === "admin") {
      // Admin can view all users with the same company code
      users = await User.find({ companyCode })
        .sort({ createdAt: -1 })
        .select("-password");
    } else if (role === "manager") {
      // Manager can view users with the same company code and store ID
      users = await User.find({ companyCode, storeId })
        .sort({ createdAt: -1 })
        .select("-password");
    } else {
      res.status(403);
      throw new Error(
        "Access denied: You do not have permission to view users"
      );
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// Upgrade or change a user role
const upgradeUser = asyncHandler(async (req, res) => {
  const { id, newRole } = req.body;

  // Validation
  if (!id || !newRole) {
    return res
      .status(400)
      .json({ message: "Please provide both user ID and the new role" });
  }

  try {
    // Find the requesting user (should be an admin)
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    // Check if the requesting user is an admin
    if (requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Only admins can upgrade a user" });
    }

    // Find the user to be upgraded
    const userToUpgrade = await User.findById(id);
    if (!userToUpgrade) {
      return res.status(404).json({ message: "User to be upgraded not found" });
    }

    // Ensure the user being upgraded belongs to the same company as the admin
    if (requestingUser.companyCode !== userToUpgrade.companyCode) {
      return res.status(403).json({
        message:
          "Access denied: You can only upgrade users within your company",
      });
    }

    // Update the user's role
    userToUpgrade.role = newRole;
    await userToUpgrade.save();

    res.status(200).json({
      message: `User role updated to ${newRole} successfully`,
      user: {
        _id: userToUpgrade._id,
        name: userToUpgrade.name,
        email: userToUpgrade.email,
        role: userToUpgrade.role,
        storeId: userToUpgrade.storeId,
      },
    });
  } catch (error) {
    console.error("Error upgrading user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Retrieve the admin user's company code from the authenticated user
  const companyCode = req.user.companyCode;

  // Validation
  if (!companyCode) {
    res.status(400);
    throw new Error("Unknown Company Code.");
  }

  // Check if the companyCode exists in the Company model
  // Retrieve the company information using the companyCode
  const company = await Company.findOne({ companyCode });
  if (!company) {
    res.status(404);
    throw new Error(
      "Company not found. Please contact the company owner or our sales team."
    );
  }

  const companyName = company.name; // Get the company name from the Company model

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Construct the folder path dynamically based on the company name and store name
    const folderPath = `Gas Station Pro/Companies/${companyName}/Users/${user.name}`;

    // Save image to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      console.log(error);
      throw new Error("Image could not be uploaded");
    }

    // Prepare file data for the image
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update user details
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name || user.name,

      phone: req.body.phone || user.phone,
      photo: Object.keys(fileData).length === 0 ? user.photo : fileData, // Update photo if new image is provided
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    storeId: updatedUser.storeId,
    phone: updatedUser.phone,
    photo: updatedUser.photo,
  });
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

// Change Password if we wanted to send the email from the backend then use below
/* const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // Validate input
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // Check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  if (user && passwordIsCorrect) {
    // Save new password
    user.password = password;
    await user.save();

    // Send notification email
    const subject = "Your Password Has Been Changed";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = process.env.REPLY_TO_EMAIL;
    const template = "passwordChangedEmail"; // Name of the Handlebars template (without extension)
    const name = user.name;
    const link = `${process.env.FRONTEND_URL}/resetpassword`; // Reset password link

    try {
      await sendEmail(subject, send_to, sent_from, reply_to, template, name);
      res.status(200).send("Password change successful");
    } catch (error) {
      res.status(500);
      throw new Error("Password changed, but email notification failed");
    }
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
}); */

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Check if the user's status is active
  if (user.status !== "active") {
    res.status(403); // Forbidden
    throw new Error(
      "Account is inactive. Please activate your account or reach out to your admin."
    );
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  // Hash token before saving to DB
  const hashedToken = hashToken(resetToken);

  // Save hashed Token to DB
  await new Token({
    userId: user._id,
    rToken: hashedToken, //updated from token to rToken
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  // send the unhashed reset token to the user
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Prepare email details
  const subject = "Reset Your Gas Station Pro Password";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = process.env.REPLY_TO_EMAIL;
  const template = "forgotPasswordEmail"; // Name of the Handlebars template (without extension)
  const link = resetUrl;
  const name = user.name;

  // Send Reset Email
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link,
      "",
      "",
      ""
    );
    res
      .status(200)
      .json({ success: true, message: "Password Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Has the token since the reset token we sent in the url was unhashed
  const hashedToken = hashToken(resetToken);

  // Find the hashed token in DB
  const userToken = await Token.findOne({
    rToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

// Activate Account for regular account creation flow
// Activate Account for regular account creation flow
const activateUser = asyncHandler(async (req, res) => {
  const { activationToken } = req.params;

  // Hash the activation token using the utils index.js function
  const hashedActivationToken = hashToken(activationToken);

  // Find the user with the hashed token in DB
  const user = await User.findOne({
    activationToken: hashedActivationToken,
    activationTokenExpires: { $gt: Date.now() }, // Ensure token hasn't expired
  });

  // If user not found or token expired
  if (!user) {
    // Attempt to find the user with an expired token for possible resend (admins)
    const userWithExpiredToken = await User.findOne({
      activationToken: hashedActivationToken,
      activationTokenExpires: { $lt: Date.now() }, // Expired token
    });

    // If the user is an admin and the token has expired, resend a new activation link
    if (userWithExpiredToken && userWithExpiredToken.role === "admin") {
      const newActivationToken = crypto.randomBytes(20).toString("hex");

      // Hash the new activation token before saving it to the DB
      const newHashedActivationToken = hashToken(newActivationToken);

      // Set the new activation token and expiration (24 hours)
      userWithExpiredToken.activationToken = newHashedActivationToken;
      userWithExpiredToken.activationTokenExpires =
        Date.now() + 24 * 60 * 60 * 1000;

      await userWithExpiredToken.save();

      // Prepare the email details
      const subject = "Your Gas Station Pro New Activation Link 🚀";
      const send_to = email;
      const sent_from = process.env.EMAIL_USER;
      const reply_to = process.env.REPLY_TO_EMAIL;
      const template = "automatedRsendAdminExpireActivationLinkEmail"; // The Handlebars template file name without extension
      const name = user.name;
      const link = `${process.env.FRONTEND_URL}/activate/${newActivationToken}`;

      try {
        await sendEmail(
          subject,
          send_to,
          sent_from,
          reply_to,
          template,
          name, // Name for personalization
          link, // we used the link variable for login code here
          null, // Link is not needed here
          null,
          null
        );
        res.status(200).json({
          success: true,
          message:
            "Your previous link expired. A new activation link has been sent to your email.",
        });
      } catch (error) {
        res.status(500);
        throw new Error("Failed to resend activation email. Please try again.");
      }
    } else {
      res.status(404);
      throw new Error("Invalid Token.");
    }
  } else {
    // If the user is found and the token is still valid, activate the user
    if (user.status === "active") {
      res.status(400);
      throw new Error("Account is already activated.");
    }

    // Activate the user account
    user.status = "active";
    user.activationToken = undefined; // Clear the activation token
    user.activationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Account Activated Successfully. Please login.",
    });
  }
});

/* const activateUser = asyncHandler(async (req, res) => {
  //const { password } = req.body;
  // we will recieve the unhashed activation token
  const { activationToken } = req.params;

  //const activationToken = crypto.randomBytes(20).toString("hex");
  // then hash the activation token using the utils index.js function
  const hashedactivationToken = hashToken(activationToken);

  // Find user with that token in DB
  // now find the hashed token in the DB
  const user = await User.findOne({
    //activationToken: activationToken,
    activationToken: hashedactivationToken,
    activationTokenExpires: { $gt: Date.now() },
  });

  // if we do not find the token or if it has expired
  if (!user) {
    res.status(404);
    //console.log(activationToken);
    //console.log(activationTokenExpires);
    //console.log(user);
    throw new Error("Invalid or Expired Token");
  }

  // check if the user is already activated
  if (user.status === "active") {
    res.status(400);
    throw new Error("Account is already activated");
  }

  //user.password = password; since the user would have set their password from the main register page
  // now make the user account active
  user.status = "active"; // Activate user
  user.activationToken = undefined; // Clear activation token
  user.activationTokenExpires = undefined;
  await user.save();
  res.status(200).json({
    message: "Account Activated Successfully, Please Login",
  });
}); */

// Activate Account added by an Admin
const activateUserAddedByAdmin = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { activationToken } = req.params; //this is the unhashed token we revieved from the activation url
  //console.log("password is. ", password);
  //console.log("Token is. ", activationToken);

  // then hash the activation token using the utils index.js function
  const hashedactivationToken = hashToken(activationToken);

  // Find user with that token in DB
  const user = await User.findOne({
    activationToken: hashedactivationToken,
    activationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(404);
    //console.log(activationToken);
    //console.log(activationTokenExpires);
    //console.log(user);
    throw new Error(
      "Invalid or Expired Token. Please ask your admin to resend activation link"
    );
  }

  // check if the user is already activated
  if (user.status === "active") {
    res.status(400);
    throw new Error("Account is already activated");
  }

  // now set the password and make user account active
  user.password = password; // we need to set the new password here since the admin created this user and we gave a random password initially
  user.status = "active"; // Activate user
  user.activationToken = undefined; // Clear activation token
  user.activationTokenExpires = undefined;
  await user.save();
  res.status(200).json({
    message: "Account Activated Successfully, Please Login",
  });
});

// Activate account and set new password
// const activateUser = asyncHandler(async (req, res) => {
//   const { activationToken } = req.params; // Token from activation link
//   const { newPassword } = req.body;

//   // Find user with valid activation token and token expiry
//   const user = await User.findOne({
//     activationToken: activationToken,
//     activationTokenExpires: { $gt: Date.now() }, // Ensure token hasn't expired
//   });

//   if (!user) {
//     res.status(400);
//     throw new Error("Invalid or expired activation token");
//   }

//   // Set new password and activate user
//   user.password = newPassword;
//   user.status = "active"; // Activate user
//   user.activationToken = undefined; // Clear activation token
//   user.activationTokenExpires = undefined;
//   await user.save();

//   // Generate token and log the user in
//   const loginToken = generateToken(user._id);

//   // Send cookie
//   res.cookie("token", loginToken, {
//     path: "/",
//     httpOnly: true,
//     expires: new Date(Date.now() + 1000 * 86400), // 1 day
//     sameSite: "none",
//     secure: true,
//   });

//   res.status(200).json({
//     message: "Account activated and password set successfully",
//     token: loginToken,
//   });
// });

// Update User by Admin, but cannot update other admins
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const adminId = req.user._id; // ID of the logged-in admin
  const { userId } = req.params; // ID of the user being updated

  // Find the admin and check if they are actually an admin
  const admin = await User.findById(adminId);

  if (!admin || admin.role !== "admin") {
    res.status(403); // Forbidden
    throw new Error("You are not authorized to perform this action");
  }

  // Find the user to be updated
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Ensure the user belongs to the admin's company
  if (user.companyCode !== admin.companyCode) {
    res.status(403);
    throw new Error("You can only update users within your company");
  }

  // Prevent admins from updating other admins
  if (user.role === "admin") {
    res.status(403);
    throw new Error("You cannot update another admin's details");
  }

  // Perform the update
  const { name, email, role, storeId, phone, photo, password } = req.body;
  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role; // Ensure role stays the same unless updated (and is not 'admin')
  user.storeId = storeId || user.storeId;
  user.phone = phone || user.phone;
  user.photo = photo || user.photo;

  // If the admin wants to update the password
  if (password) {
    user.password = password;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    storeId: updatedUser.storeId,
    phone: updatedUser.phone,
    photo: updatedUser.photo,
  });
});

// Disable User
const disableUser = asyncHandler(async (req, res) => {
  const adminId = req.user._id; // ID of the logged-in admin
  const { userId } = req.params; // ID of the user being disabled

  // Find the admin and check if they are actually an admin
  const admin = await User.findById(adminId);

  if (!admin || admin.role !== "admin") {
    res.status(403); // Forbidden
    throw new Error("You are not authorized to perform this action");
  }

  // Find the user to be disabled
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Ensure the user belongs to the admin's company
  if (user.companyCode !== admin.companyCode) {
    res.status(403);
    throw new Error("You can only disable users within your company");
  }

  // Prevent admins from disabling other admins
  if (user.role === "admin") {
    res.status(403);
    throw new Error("You cannot disable another admin's account");
  }

  // Set the user's status to 'inactive'
  user.status = "inactive";

  const updatedUser = await user.save();

  res.status(200).json({
    message: `User ${updatedUser.name} has been disabled.`,
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    status: updatedUser.status,
  });
});

// Enable a user (admin only)
const enableUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminUser = req.user; // This comes from the protect middleware

    // Find the user by ID and ensure they belong to the same company and are not admins
    const user = await User.findOne({
      _id: userId,
      companyUniqueCode: adminUser.companyUniqueCode,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found or you are not authorized to enable this user",
      });
    }

    // Ensure that the user being enabled is not an admin
    if (user.role === "admin") {
      return res.status(403).json({ message: "You cannot enable an admin" });
    }

    // Set the user status to active
    user.status = "active";
    await user.save();

    res.status(200).json({ message: "User enabled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to enable user", error: error.message });
  }
};

// Change the status of a user (admin only)
const changeStatus = async (req, res) => {
  try {
    const { id, newStatus } = req.body; // Get the new status from the request body
    const adminUser = req.user; // Get the authenticated user from the protect middleware

    // Ensure the user sending the request is an admin
    if (adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can change user status" });
    }

    // Ensure the provided status is valid
    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    // Find the user by ID and ensure they belong to the same company as the admin
    const user = await User.findOne({
      _id: id,
      companyUniqueCode: adminUser.companyUniqueCode,
    });

    if (!user) {
      return res.status(404).json({
        message:
          "User not found or you are not authorized to change this user's status",
      });
    }

    // Ensure that the user being changed is not an admin
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ message: "You cannot change the status of an admin" });
    }

    // Update the user's status
    user.status = newStatus;
    await user.save();

    res
      .status(200)
      .json({ message: `User status changed to ${newStatus} successfully` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to change user status", error: error.message });
  }
};

// Resend Activation Link
const resendActivationLink = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    res.status(400);
    throw new Error("Please provide your email");
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found, please sign up.");
  }

  // Check if the activation token has expired
  if (user.activationTokenExpires && user.activationTokenExpires < Date.now()) {
    // Generate a new activation token
    const activationToken = crypto.randomBytes(20).toString("hex");

    // Hash token before saving to DB
    const hashedActivationToken = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");

    // Set the new activation token and expiration
    user.activationToken = hashedActivationToken;
    user.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    await user.save();

    // Prepare activation link
    const activationLink = `${process.env.FRONTEND_URL}/activate/${hashedActivationToken}`;

    // Send activation email
    const message = `
      <h2>Hello ${user.name}</h2>
      <p>Welcome back! Please click the link below to activate your account.</p>
      <p>This activation link is valid for only 24 hours.</p>
      <a href=${activationLink} clicktracking=off>${activationLink}</a>
      <p>Regards...</p>
      <p>Gas Station Pro Team</p>
    `;

    const subject = "Activate Your Account";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
      await sendEmail(subject, message, send_to, sent_from);
      res
        .status(200)
        .json({ success: true, message: "Activation email resent" });
    } catch (error) {
      res.status(500);
      throw new Error("Email not sent, please try again");
    }
  } else {
    res.status(400).json({
      message: "Activation link is still valid. Please check your email.",
    });
  }
});

// Get Users in batch
const getBatchUsers = asyncHandler(async (req, res) => {
  try {
    const { userIds } = req.body;
    const users = await User.find({ _id: { $in: userIds } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Get userId from request parameters

  // Find the admin making the request (assuming you have the user info in req.user)
  const admin = req.user; // The authenticated admin

  // Ensure the admin has permission to delete users in their company
  if (admin.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete users");
  }

  // Find the user to be deleted
  const userToDelete = await User.findById(userId);

  if (!userToDelete) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if the user belongs to the same company as the admin
  if (userToDelete.companyCode !== admin.companyCode) {
    res.status(403);
    throw new Error("You can only delete users from your company");
  }

  // Ensure admins cannot delete other admins
  if (userToDelete.role === "admin") {
    res.status(403);
    throw new Error("Admins cannot delete other admins");
  }

  // Delete the user
  await User.findByIdAndDelete(userId);

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

//Admin can set a password for a user without knowing thier current password
// Set a new password for a user (admin only)
const adminSetPassword = async (req, res) => {
  try {
    const { id, newPassword } = req.body; // Get the user ID and new password from the request body
    const adminUser = req.user; // Get the authenticated admin user from the protect middleware

    // Ensure the user sending the request is an admin
    if (adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can set user passwords" });
    }

    // Find the user by ID and ensure they belong to the same company as the admin
    const user = await User.findOne({
      _id: id,
      companyUniqueCode: adminUser.companyUniqueCode,
    });

    if (!user) {
      return res.status(404).json({
        message:
          "User not found or you are not authorized to set this user's password",
      });
    }

    // Ensure that the user being updated is not an admin
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ message: "You cannot change the password of an admin" });
    }

    // Set the new password for the user
    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ message: "User password has been set successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to set user password", error: error.message });
  }
};

// Send Automated Emails
const sendAutomatedEmail = asyncHandler(async (req, res) => {
  // things we need from the frontend when we need to send an email
  const {
    subject,
    send_to,
    reply_to,
    template,
    url,
    ownerName,
    companyName,
    storeName,
    managerName,
    reportDate,
    updatedDate,
    planType,
    planCost,
    planCycle,
    planTier,
    planRenewalDate,
    planExpiryDate,
  } = req.body;

  // check if the 4 compulsory values we need are available
  if (!subject || !send_to || !reply_to || !template) {
    res.status(500);
    throw new Error("Missing email parameter");
  }

  // Get user that we want to send the email too from the database
  const user = await User.findOne({ email: send_to });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // if the user is found then define the other email parameters and then send email
  const sent_from = process.env.EMAIL_USER;
  const name = user.name;
  const link = `${process.env.FRONTEND_URL}${url}`;
  const companyCode = user.companyCode;

  try {
    //call the function to send email
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link,
      companyCode, //companyCode was above link but I switched it to fix the password changed automated email issue where the link was showing  the comp code
      ownerName,
      companyName,
      storeName,
      managerName,
      reportDate,
      updatedDate,
      planType,
      planCost,
      planCycle,
      planTier,
      planRenewalDate,
      planExpiryDate
    );
    res.status(200).json({ message: "Email Sent" });
  } catch (error) {
    res.status(500);
    console.log(error);
    throw new Error("Email not sent, please try again");
  }
});

// Send Activation Email
const sendActivationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // check if the user exists
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // check if the user is already active
  if (user.status === "active") {
    res.status(400);
    throw new Error("User is already activated");
  }

  // check if a token already exists for this user and delete it first
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Now create the activation token and save it to the DB
  const activationToken = crypto.randomBytes(32).toString("hex") + user._id;

  // Hash the token and save to DB
  // use the hashToken function from our utils folder index.js
  const hashedToken = hashToken(activationToken);
  await new Token({
    userId: user._id,
    aToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
  }).save();

  // construct an activation url. note: we saved the hasdhed token to DB but we will send the regular unhashed token in the url
  // once we get the url, we will then hash the token and then compare to the hashedToken in our database
  const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

  // Send Activation Email
  // these are the values we need to send an email
  const subject = "Welcome to Gas Station Pro, Activate Your Account Now 🚀";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = "noreply@gasstationpro.com";
  const template = "activateEmail"; // Match the file name without handlebars extension
  const name = user.name;
  const companyCode = user.companyCode;
  const link = activationUrl;

  // Send the mail
  try {
    //call the function to send email
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      companyCode,
      link
    );
    res.status(200).json({ message: "Activation Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Import users via CSV file
const importUsers = asyncHandler(async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);

  const users = [];
  const invalidRows = [];
  const companyCode = req.user.companyCode; // Use the companyCode from the authenticated admin user

  // Ensure the company exists
  const company = await Company.findOne({ companyCode });
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  // Read and parse the CSV file
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true })) // Use the first row of the CSV as headers
    .on("data", (row, index) => {
      const { name, email, role, storeName, phone } = row;

      // Basic validation for required fields
      if (!name || !email) {
        invalidRows.push({
          row: index + 1,
          message: "Missing required fields: name, email",
        });
        return; // Skip this row and continue processing other rows
      }

      users.push({
        name,
        email: email.trim(),
        role: role ? role.toLowerCase() : "manager",
        storeName: storeName ? storeName.trim() : null,
        phone: phone ? phone.trim() : "+234",
        companyCode,
      });
    })
    .on("end", async () => {
      const existingUsers = [];
      const createdUsers = [];

      try {
        for (let userData of users) {
          const { name, email, role, storeName, phone, companyCode } = userData;

          // Check if user already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            existingUsers.push({ name, email });
            continue; // Skip the existing user
          }

          // Find the store if storeName is provided
          let storeObjectId = null;
          if (storeName) {
            const storeExists = await Store.findOne({
              name: storeName,
              companyCode,
            });
            if (storeExists) {
              storeObjectId = storeExists._id;
            } else {
              invalidRows.push({
                row: index + 1,
                message: `Store ${storeName} not found`,
              });
              continue; // Skip users with invalid store
            }
          }

          // Generate a random password
          const randomPassword = crypto.randomBytes(8).toString("hex");

          // Hash the password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(randomPassword, salt);

          // Create the user
          const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            storeId: storeObjectId,
            phone,
            companyCode,
            status: "inactive", // Set user as inactive by default
          });

          // Generate activation token and link
          const activationToken = crypto.randomBytes(20).toString("hex");
          const hashedActivationToken = crypto
            .createHash("sha256")
            .update(activationToken)
            .digest("hex");
          const activationLink = `${process.env.FRONTEND_URL}/activateaddedbyadmin/${activationToken}`;

          // Save activation token and expiry in the user record
          user.activationToken = hashedActivationToken;
          user.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
          await user.save();

          // Send activation email
          const subject =
            "Your Admin Has Created an Account for You, Activate Now 🚀";
          const send_to = user.email;
          const sent_from = process.env.EMAIL_USER;
          const reply_to = process.env.REPLY_TO_EMAIL;
          const template = "activationAddedByAdminEmail";
          const link = activationLink;

          try {
            await sendEmail(
              subject,
              send_to,
              sent_from,
              reply_to,
              template,
              name,
              link,
              companyCode,
              "",
              ""
            );
          } catch (error) {
            invalidRows.push({
              row: index + 1,
              message: `Failed to send activation email to ${email}`,
            });
            continue;
          }

          createdUsers.push(user);
        }

        // Send the response, including skipped and invalid rows
        res.status(201).json({
          message: "Users imported successfully",
          count: createdUsers.length,
          existingUsers,
          invalidRows,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error importing users",
          error: error.message,
        });
      }
    })
    .on("error", (error) => {
      res.status(500).json({
        message: "Failed to process CSV file",
        error: error.message,
      });
    });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get the user ID from the request parameters

  // Find the requesting user (who is making the request)
  const requestingUser = await User.findById(req.user._id);

  if (!requestingUser) {
    res.status(404);
    throw new Error("Requesting user not found");
  }

  // Ensure the requesting user is either an admin or a manager
  if (requestingUser.role !== "admin" && requestingUser.role !== "manager") {
    res.status(403);
    throw new Error("Access denied: Only admins or managers can view users");
  }

  // Find the user by ID
  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Ensure the user being accessed belongs to the same company as the requesting user
  if (user.companyCode !== requestingUser.companyCode) {
    res.status(403);
    throw new Error(
      "Access denied: You can only view users within your company"
    );
  }

  // Return the user details, excluding sensitive fields like password
  const {
    _id,
    companyCode,
    name,
    email,
    role,
    storeId,
    phone,
    photo,
    status,
    createdAt,
    updatedAt,
  } = user;

  res.status(200).json({
    _id,
    companyCode,
    name,
    email,
    role,
    storeId,
    phone,
    photo,
    status,
    createdAt,
    updatedAt,
  });
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  getUsers,
  loginStatus,
  upgradeUser,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  //activateAccount,
  activateUser,
  //setupInitialPassword,
  updateUserByAdmin,
  disableUser,
  enableUser,
  resendActivationLink,
  deleteUser,
  getBatchUsers,
  registerUserAddedByAdmin,
  activateUserAddedByAdmin,
  sendAutomatedEmail,
  sendActivationEmail,
  sendLoginCode,
  loginWithCode,
  changeStatus,
  adminSetPassword,
  sendReportDeleteCode,
  getUserById,
  importUsers,
};
