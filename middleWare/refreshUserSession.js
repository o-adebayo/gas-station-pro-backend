// middleware/refreshSessionMiddleware.js (if you choose to create a new file)
const refreshUserSession = (req, res, next) => {
  const token = req.cookies.token;
  const currentTime = new Date();
  if (token) {
    const newExpiration = new Date(Date.now() + 1000 * 14400); // 4 hours from now
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: newExpiration,
      sameSite: "none",
      secure: true,
    });
    /* console.log(
      `Token expiration extended to: ${newExpiration} on ${req.path}`
    ); */
  }
  next();
};

module.exports = refreshUserSession;
