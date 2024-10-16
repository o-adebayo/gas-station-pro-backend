const SalesReport = require("../models/salesReportModel");
const User = require("../models/userModel");
const Store = require("../models/storeModel");
const Company = require("../models/companyModel");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const { generateToken, hashToken } = require("../utils");
var parser = require("ua-parser-js");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.CRYPTR_KEY);

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
// Create Sales Report
const createSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images, storeTotalSales, storeId } =
      req.body;
    const user = await User.findById(req.user._id);

    // Determine the storeId based on user role
    let selectedStoreId;
    if (user.role === "admin") {
      // Admin must provide a store ID
      if (!storeId) {
        return res.status(400).json({
          message: "Store ID is required for admins when creating a report.",
        });
      }
      selectedStoreId = storeId;
    } else if (user.role === "manager") {
      // For managers, the store ID is tied to the manager's user account
      if (!user.storeId) {
        return res.status(400).json({
          message:
            "No storeId found for you, please advise the admin to assign a store.",
        });
      }
      selectedStoreId = user.storeId;
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized to create report." });
    }

    // Find the store using the storeId (sent by admin or derived from the manager's data)
    const store = await Store.findById(selectedStoreId);
    if (!store) {
      return res.status(404).json({
        message: "Store not found.",
      });
    }

    // Retrieve store name from the found store
    const storeName = store.name; // Assuming 'storeName' is the name field in the Store model
    const managerName = store.managerName || user.name; // Use manager's name from the store or user model

    // Create the new sales report
    const newReport = new SalesReport({
      date,
      preparedBy: req.user._id, // Assuming the logged-in user is the preparer
      companyCode: user.companyCode,
      storeId: selectedStoreId, // Store ID (admin-selected or manager's store)
      products,
      notes,
      images,
      storeTotalSales: {
        totalSalesLiters: storeTotalSales.totalSalesLiters || 0,
        totalSalesDollars: storeTotalSales.totalSalesDollars || 0,
      },
      storeName, // Store name from the Store model
      managerName, // Manager's name from the Store model or user
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
// Edit Sales Report
const editSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images, storeTotalSales } = req.body;

    // Find the sales report by ID
    const salesReport = await SalesReport.findById(req.params.id);
    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }

    // Find the user making the request
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

    // Update date if provided
    if (date) {
      salesReport.date = date;
    }

    // Deep merge 'products' structure to avoid overwriting existing data
    if (products) {
      Object.keys(products).forEach((productKey) => {
        if (!salesReport.products[productKey]) {
          salesReport.products[productKey] = {};
        }

        // Merge sub-fields (dippingTanks, pumps, etc.)
        Object.keys(products[productKey]).forEach((subKey) => {
          if (Array.isArray(products[productKey][subKey])) {
            // If the subKey is an array (like 'dippingTanks' or 'pumps'), overwrite it
            salesReport.products[productKey][subKey] =
              products[productKey][subKey];
          } else {
            // Otherwise, just update the field
            salesReport.products[productKey][subKey] =
              products[productKey][subKey];
          }
        });
      });
    }

    // Update notes if provided
    if (notes) {
      salesReport.notes = notes;
    }

    // Update storeTotalSales if provided
    if (storeTotalSales) {
      salesReport.storeTotalSales = {
        totalSalesLiters:
          storeTotalSales.totalSalesLiters !== undefined
            ? storeTotalSales.totalSalesLiters
            : salesReport.storeTotalSales.totalSalesLiters,
        totalSalesDollars:
          storeTotalSales.totalSalesDollars !== undefined
            ? storeTotalSales.totalSalesDollars
            : salesReport.storeTotalSales.totalSalesDollars,
      };
    }

    // Handle images - only append unique new images
    // before implemeting ability to also delete images when editing report
    /*     if (images && images.length > 0) {
      const uniqueNewImages = images.filter(
        (image) => !salesReport.images.includes(image)
      );
      salesReport.images = [...salesReport.images, ...uniqueNewImages];
    } */

    // Handle images - replace with the provided images and remove duplicates
    if (images) {
      // Filter unique images using a Set to avoid duplicates
      const uniqueImages = Array.from(new Set(images));
      salesReport.images = uniqueImages; // Replace with unique images
    }

    // Save the updated report
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

/* const editSalesReport = async (req, res) => {
  try {
    const { date, products, notes, images, storeTotalSales } = req.body;

    // Find the sales report by ID
    const salesReport = await SalesReport.findById(req.params.id);
    if (!salesReport) {
      return res.status(404).json({ message: "Sales Report not found" });
    }

    // Find the user making the request
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

    // Update the report fields
    if (date) salesReport.date = date;

    // Deep merge 'products' structure
    if (products) {
      Object.keys(products).forEach((productKey) => {
        if (!salesReport.products[productKey]) {
          salesReport.products[productKey] = {};
        }

        // Merge sub-fields (dippingTanks, pumps, etc.)
        Object.keys(products[productKey]).forEach((subKey) => {
          salesReport.products[productKey][subKey] =
            products[productKey][subKey];
        });
      });
    }

    // Update notes
    if (notes) salesReport.notes = notes;

    // Update storeTotalSales
    if (storeTotalSales) {
      salesReport.storeTotalSales = {
        totalSalesLiters:
          storeTotalSales.totalSalesLiters !== undefined
            ? storeTotalSales.totalSalesLiters
            : salesReport.storeTotalSales.totalSalesLiters,
        totalSalesDollars:
          storeTotalSales.totalSalesDollars !== undefined
            ? storeTotalSales.totalSalesDollars
            : salesReport.storeTotalSales.totalSalesDollars,
      };
    }

    // Handle new images (prevent duplication)
    if (images && images.length > 0) {
      // Filter out any duplicate images
      const uniqueNewImages = images.filter(
        (image) => !salesReport.images.includes(image)
      );
      // Append only unique new images
      salesReport.images = [...salesReport.images, ...uniqueNewImages];
    }

    // Save the updated report
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
 */
/* // Edit Sales Report
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
}; */

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
    console.log("User info:", user); // Log user info

    // Admin deletion logic
    if (user.role === "admin") {
      console.log("Admin user, proceeding with report deletion...");
      await SalesReport.deleteOne({ _id: req.params.id });
      return res
        .status(200)
        .json({ message: "Sales Report deleted by admin." });
    }

    // Manager deletion logic
    if (user.role === "manager") {
      const { deleteCode } = req.body;

      if (!deleteCode) {
        return res.status(400).json({ message: "Delete code is required" });
      }

      // Fetch the token
      const userToken = await Token.findOne({
        userId: user._id,
        expiresAt: { $gt: Date.now() }, // Ensure token is valid and not expired
      });

      if (!userToken) {
        return res
          .status(400)
          .json({ message: "Invalid or expired delete code" });
      }

      // Decrypt the delete token
      const decryptedDeleteCode = cryptr.decrypt(userToken.dToken);

      // Compare the provided delete code with the decrypted one
      if (decryptedDeleteCode !== deleteCode) {
        return res.status(400).json({ message: "Invalid delete code" });
      }

      // If the report contains images, delete them from Cloudinary
      if (salesReport.images && salesReport.images.length > 0) {
        const deletePromises = salesReport.images.map((imageUrl) => {
          const publicId = extractPublicIdFromUrl(imageUrl);
          return cloudinary.uploader.destroy(publicId); // Delete images from Cloudinary
        });

        await Promise.all(deletePromises);
      }

      // Delete the sales report from MongoDB
      await SalesReport.deleteOne({ _id: req.params.id });

      // Invalidate the token by either deleting it or updating its expiration date
      userToken.expiresAt = Date.now(); // Set the token's expiration to now (making it invalid)
      await userToken.save(); // Save the updated token

      return res.status(200).json({
        message:
          "Sales Report and associated images removed, and delete code invalidated.",
      });
    }

    // If the user is not authorized
    return res
      .status(403)
      .json({ message: "Unauthorized to delete this report" });
  } catch (error) {
    console.error("Error during deletion:", error); // Detailed logging of error object
    return res.status(500).json({ message: error.message });
  }
};

/* const deleteSalesReport = async (req, res) => {
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
      res.status(403).json({ message: "Unauthorized to delete this report. Please reach out to the owner for a delete code" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; */

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
