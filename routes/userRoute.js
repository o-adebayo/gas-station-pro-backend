const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  activateAccount,
  setupInitialPassword,
  updateUserByAdmin,
  disableUser,
  enableUser,
  activateUser,
  resendActivationLink,
  deleteUser,
  getBatchUsers,
  activateUserAddedByAdmin,
  registerUserAddedByAdmin,
  getUsers,
  upgradeUser,
  sendAutomatedEmail,
  sendActivationEmail,
  sendLoginCode,
  loginWithCode,
  changeStatus,
  adminSetPassword,
  sendReportDeleteCode,
  importUsers,
} = require("../controllers/userController");
const protect = require("../middleWare/authMiddleware");
// fixed middleWare spelling

const { upload, uploadCSV } = require("../utils/fileUpload");

// whenever someone gets to this path of the website
// trigger the corresponding function based on the definition in controllers file
router.post("/register", registerUser);
router.post(
  "/registerbyadmin",
  protect(["admin"]),
  upload.single("photo"),
  registerUserAddedByAdmin
);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/getuser", protect(), getUser); //note: we have access to req.user any page we apply the protect() on from this list e.g. this allows it in userController since getUser is from that page
router.get("/getusers", protect(), getUsers);
router.get("/loggedin", loginStatus);
router.post("/upgradeUser", protect(["admin"]), upgradeUser); //this is for changing a user's role
router.patch("/updateuser", protect(), upload.single("photo"), updateUser);
router.patch("/changepassword", protect(), changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.put("/activate/:activationToken", activateUser);
router.put("/activateaddedbyadmin/:activationToken", activateUserAddedByAdmin); //this is for users that are added by an admin
router.post("/resend-activation", resendActivationLink);
//router.put("/activateaccount/:activateToken", activateAccount);
//router.put("/setuppassowrd/:activateToken", setupInitialPassword);
router.patch("/updateuser/:userId", protect(["admin"]), updateUserByAdmin);
// Enable or Disable or change status of a user by admin (admin only)
router.put("/:userId/disable", protect(["admin"]), disableUser);
router.put("/:userId/enable", protect(["admin"]), enableUser);
router.post("/changeUserStatus", protect(["admin"]), changeStatus);
router.post("/adminSetPassword", protect(["admin"]), adminSetPassword);
// Route to delete a user
router.delete("/:userId", protect(["admin"]), deleteUser);
router.post("/batch", protect(), getBatchUsers);

// Route to send automated email
router.post("/sendAutomatedEmail", protect(), sendAutomatedEmail);

// Route to send activation email
router.post("/sendActivationEmail", protect(), sendActivationEmail);

//route for admins to send a delete code to managers to delete a report
router.post("/sendReportDeleteCode", protect(["admin"]), sendReportDeleteCode);

// Route for login with code when 2FA is triggered
router.post("/sendLoginCode/:email", sendLoginCode);
router.post("/loginWithCode/:email", loginWithCode);

// Import users via CSV file
router.post(
  "/import-users",
  protect(["admin"]),
  uploadCSV.single("csvFile"),
  importUsers
);

module.exports = router;
