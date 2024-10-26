const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const storeRoute = require("./routes/storeRoute");
const contactRoute = require("./routes/contactRoute");
const salesReportRoute = require("./routes/salesReportRoute");
const companyRoute = require("./routes/companyRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

// Initialize express
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://gassationpro.vercel.app",
    "https://gasstationpro.com",
    "https://www.gasstationpro.com",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Use CORS with the configured options
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options("*", cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the public folder

// Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/stores", storeRoute);
app.use("/api/contactus", contactRoute);
app.use("/api/reports", salesReportRoute);
app.use("/api/companies", companyRoute);

// Routes
app.get("/", (req, res) => {
  res.send("Home Page");
});

// Error Middleware
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
