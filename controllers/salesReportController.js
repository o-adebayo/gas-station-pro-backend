const SalesReport = require("../models/salesReportModel");
const User = require("../models/userModel");
const Store = require("../models/storeModel");
const Company = require("../models/companyModel");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to get month in text from a date
const getMonthText = (date) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[new Date(date).getMonth()];
};

// Helper function to get year from a date
const getYear = (date) => {
  return new Date(date).getFullYear();
};

// Helper function to get day from a date
const getDay = (date) => {
  return new Date(date).getDate(); // Returns the day of the month (1-31)
};

// Helper function to extract Cloudinary public ID from URL
const extractPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1]; // Get the last part of the URL
  const publicIdWithExtension = fileName.split(".")[0]; // Remove the extension (.jpg, .png, etc.)
  return publicIdWithExtension;
};

// Create Sales Report
const createSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images, storeTotalSales } = req.body;
    const user = await User.findById(req.user._id);

    // Check if the user has a storeId
    if (!user.storeId) {
      return res.status(400).json({
        message:
          "No storeId found for you, please advise the manager to submit the form.",
      });
    }

    // Find the store where the managerId matches the current user's _id
    const store = await Store.findOne({ managerId: user._id });
    if (!store) {
      return res.status(404).json({
        message: "No store found for the current manager.",
      });
    }
    // Retrieve store name from the found store
    const storeName = store.name; // Assuming 'storeName' is the name field in the Store model
    const managerName = user.name; // Manager's name from the User model

    /*     // Determine the storeId based on user role
    let storeId;
    if (user.role === "admin") {
      storeId = user.storeId.toString(); // Use admin's storeId
    } else if (user.role === "manager") {
      storeId = user.storeId.toString(); // Use manager's storeId
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized to create report." });
    } */

    // Create the new sales report
    const newReport = new SalesReport({
      date,
      preparedBy: req.user._id, // Assuming the logged-in user is the preparer
      companyCode: user.companyCode,
      storeId: user.storeId,
      products,
      notes,
      images,
      storeTotalSales: {
        totalSalesLiters: storeTotalSales.totalSalesLiters || 0,
        totalSalesDollars: storeTotalSales.totalSalesDollars || 0,
      },
      storeName, // Store name from the Store model
      managerName, // Manager's name from the User model
    });

    const savedReport = await newReport.save();
    return res.status(201).json({
      ...savedReport._doc,
      day: getDay(date), // Add day
      month: getMonthText(date), // Add month in text format
      year: getYear(date), // Add year
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View All Sales Reports (Admins and Managers)
const viewAllSalesReports = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let query;
    if (user.role === "admin") {
      query = { companyCode: user.companyCode };
    } else if (user.role === "manager") {
      query = { companyCode: user.companyCode, storeId: user.storeId };
    }

    const salesReports = await SalesReport.find(query).sort({ date: -1 });
    const reportsWithDateInfo = salesReports.map((report) => ({
      ...report._doc,
      day: getDay(report.date), // Add day
      month: getMonthText(report.date), // Add month in text format
      year: getYear(report.date), // Add year
    }));
    res.status(200).json(reportsWithDateInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get One Sales Report by ID
const getSalesReportById = async (req, res) => {
  try {
    const salesReport = await SalesReport.findById(req.params.id);
    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }
    res.status(200).json({
      ...salesReport._doc,
      day: getDay(salesReport.date), // Add day
      month: getMonthText(salesReport.date), // Add month in text format
      year: getYear(salesReport.date), // Add year
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit Sales Report
const editSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images, storeTotalSales } = req.body;

    const salesReport = await SalesReport.findById(req.params.id);

    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }

    const user = await User.findById(req.user._id);

    // Only allow admin or manager of the same store to update
    if (
      user.role !== "admin" &&
      (user.role !== "manager" ||
        user.storeId.toString() !== salesReport.storeId.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this report" });
    }

    // Handle updating the fields with deep merging for nested structures
    if (date) salesReport.date = date;

    // Update the nested 'products' structure
    if (products) {
      Object.keys(products).forEach((productKey) => {
        if (!salesReport.products[productKey]) {
          salesReport.products[productKey] = {};
        }

        // Merge dippingTanks, pumps, etc.
        Object.keys(products[productKey]).forEach((key) => {
          salesReport.products[productKey][key] = products[productKey][key];
        });
      });
    }

    // Update notes
    if (notes) salesReport.notes = notes;

    // Update storeTotalSales if provided
    if (storeTotalSales) {
      salesReport.storeTotalSales = {
        totalSalesLiters:
          storeTotalSales.totalSalesLiters ||
          salesReport.storeTotalSales.totalSalesLiters,
        totalSalesDollars:
          storeTotalSales.totalSalesDollars ||
          salesReport.storeTotalSales.totalSalesDollars,
      };
    }

    // Handle new images
    if (images && images.length > 0) {
      salesReport.images = [...salesReport.images, ...images]; // Append new images
    }

    // Save updated report
    const updatedReport = await salesReport.save();

    return res.status(200).json({
      ...updatedReport._doc,
      day: getDay(updatedReport.date),
      month: getMonthText(updatedReport.date),
      year: getYear(updatedReport.date),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// OLD Edit Sales Report
/* const editSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images } = req.body;
    const salesReport = await SalesReport.findById(req.params.id);

    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }

    const user = await User.findById(req.user._id);

    if (
      user.role === "admin" ||
      (user.role === "manager" &&
        user.storeId.toString() === salesReport.storeId.toString())
    ) {
      // Update the fields with deep merging for nested structures
      salesReport.date = date || salesReport.date;
      salesReport.products = products
        ? { ...salesReport.products, ...products } // Merge existing and new product data
        : salesReport.products;
      salesReport.notes = notes || salesReport.notes;
      salesReport.images = images || salesReport.images;

      // Save the updated report
      const updatedReport = await salesReport.save();
      res.status(200).json({
        ...updatedReport._doc,
        day: getDay(updatedReport.date), // Add day
        month: getMonthText(updatedReport.date), // Add month in text format
        year: getYear(updatedReport.date), // Add year
      });
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this report" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; */

// Delete Sales Report (Only Company Owner/Admin)
const deleteSalesReport = async (req, res) => {
  try {
    const salesReport = await SalesReport.findById(req.params.id);
    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }

    const user = await User.findById(req.user._id);
    const company = await Company.findOne({
      companyCode: user.companyCode,
    });

    if (user.role === "admin" && company.ownerEmail === user.email) {
      // If the report contains images, delete them from Cloudinary
      if (salesReport.images && salesReport.images.length > 0) {
        const deletePromises = salesReport.images.map((imageUrl) => {
          const publicId = extractPublicIdFromUrl(imageUrl);
          return cloudinary.uploader.destroy(publicId); // Delete the image from Cloudinary
        });

        await Promise.all(deletePromises);
      }

      // Delete the sales report from MongoDB
      await SalesReport.deleteOne({ _id: req.params.id });
      res
        .status(200)
        .json({ message: "Sales Report and associated images removed" });
    } else {
      res.status(403).json({ message: "Unauthorized to delete this report" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sort and Filter Sales Reports
const sortAndFilterReports = async (req, res) => {
  try {
    const { sortBy, filterByStore, filterByManager } = req.query;
    const user = await User.findById(req.user._id);

    let query = { companyCode: user.companyCode };

    if (user.role === "manager") {
      query.storeId = user.storeId;
    }

    if (filterByStore) {
      query.storeId = filterByStore;
    }

    if (filterByManager) {
      const manager = await User.findOne({ name: filterByManager });
      if (manager) {
        query.preparedBy = manager._id;
      }
    }

    const salesReports = await SalesReport.find(query).sort({ [sortBy]: -1 });
    const reportsWithDateInfo = salesReports.map((report) => ({
      ...report._doc,
      day: getDay(report.date), // Add day
      month: getMonthText(report.date), // Add month in text format
      year: getYear(report.date), // Add year
    }));

    res.status(200).json(reportsWithDateInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Exporting the controller functions
module.exports = {
  createSalesReport,
  viewAllSalesReports,
  getSalesReportById,
  editSalesReport,
  deleteSalesReport,
  sortAndFilterReports,
};
