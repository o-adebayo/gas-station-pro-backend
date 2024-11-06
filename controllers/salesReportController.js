const asyncHandler = require("express-async-handler");
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
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");

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
    //const { date, products, notes, storeTotalSales, storeId } = req.body;
    //console.log("Received storeId in createSalesReport:", storeId); // Check storeId

    const user = await User.findById(req.user._id);

    // Parse JSON data from FormData
    const { data } = req.body;
    const parsedData = JSON.parse(data);
    const { date, products, notes, images, storeTotalSales, storeId } =
      parsedData;

    console.log("Parsed storeId in createSalesReport:", storeId); // Check parsed storeId

    let selectedStoreId;

    if (user.role === "admin") {
      if (!storeId) {
        return res.status(400).json({
          message: "Store ID is required for admins when creating a report.",
        });
      }
      selectedStoreId = storeId;
    } else if (user.role === "manager") {
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

    const store = await Store.findById(selectedStoreId);
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    const storeName = store.name;
    const folderPath = `Gas Station Pro/Companies/${user.companyCode}/Stores/${storeName}/SalesReports`;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: folderPath,
          resource_type: "image",
        });
        imageUrls.push(uploadResult.secure_url);
      }
    }

    const newReport = new SalesReport({
      date,
      preparedBy: req.user._id,
      companyCode: user.companyCode,
      storeId: selectedStoreId,
      products,
      notes,
      images: imageUrls,
      storeTotalSales: {
        totalSalesLiters: storeTotalSales.totalSalesLiters || 0,
        totalSalesDollars: storeTotalSales.totalSalesDollars || 0,
      },
      storeName,
      managerName: store.managerName || user.name,
    });

    const savedReport = await newReport.save();
    res.status(201).json({
      ...savedReport._doc,
      day: getDay(date),
      month: getMonthText(date),
      year: getYear(date),
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

// get reports by store ID
const getSalesReportsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Fetch all sales reports for the specified storeId
    const salesReports = await SalesReport.find({ storeId }).sort({ date: -1 });

    if (!salesReports || salesReports.length === 0) {
      return res
        .status(404)
        .json({ message: "No sales reports found for this store" });
    }

    // Format each report's date and include it in the response
    const reportsWithDateInfo = salesReports.map((report) => ({
      ...report._doc,
      day: getDay(report.date),
      month: getMonthText(report.date),
      year: getYear(report.date),
    }));

    res.status(200).json(reportsWithDateInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit sales report with image upload to cloudinary from backend
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

    // Handle new images - Upload to Cloudinary and add URLs to images array
    const store = await Store.findById(salesReport.storeId);
    const storeName = store.name;
    const folderPath = `Gas Station Pro/Companies/${user.companyCode}/Stores/${storeName}/SalesReports`;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: folderPath,
          resource_type: "image",
        });
        salesReport.images.push(uploadResult.secure_url);
      }
    }

    // Append any additional image URLs from req.body to avoid overwriting
    if (images && images.length > 0) {
      const uniqueNewImages = images.filter(
        (url) => !salesReport.images.includes(url)
      );
      salesReport.images = [...salesReport.images, ...uniqueNewImages];
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
      if (salesReport.images && salesReport.images.length > 0) {
        const deletePromises = salesReport.images.map((imageUrl) => {
          const publicId = extractPublicIdFromUrl(imageUrl);
          return cloudinary.uploader.destroy(publicId);
        });
        await Promise.all(deletePromises);
      }
      await SalesReport.deleteOne({ _id: req.params.id });
      return res.status(200).json({
        message: "Sales Report and associated images deleted by admin.",
      });
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

//used with server side pagination
const getDetailedSalesReport = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, sort = "{}", search = "" } = req.query;
    //console.log("Raw sort parameter from frontend:", req.query.sort);

    // Parse sort parameter
    let sortFormatted;
    try {
      //sortFormatted = JSON.parse(JSON.parse(sort)); // Double parse to handle escaping
      sortFormatted = sort ? JSON.parse(JSON.parse(sort)) : {}; // Parse if not undefined or empty
    } catch (error) {
      console.error("Error parsing sort parameter:", error);
      sortFormatted = {}; // Fallback to empty object if parsing fails
    }

    // Construct sort option
    const sortOption = sortFormatted.field
      ? { [sortFormatted.field]: sortFormatted.sort === "asc" ? 1 : -1 }
      : {};
    //console.log("Parsed Sort Option:", sortOption); // Check final sort option

    // Fetch the user from the request
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Build the base query based on the user's role and company code
    const baseQuery =
      user.role === "admin"
        ? { companyCode: user.companyCode }
        : { companyCode: user.companyCode, storeId: user.storeId };

    // Build the search query only if a search term is provided
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: new RegExp(search, "i") } },
            { managerName: { $regex: new RegExp(search, "i") } },
            { storeName: { $regex: new RegExp(search, "i") } }, // Adding storeName to the search
          ],
        }
      : {};

    // Combine base query with search query
    const combinedQuery = { ...baseQuery, ...searchQuery };

    // Fetch reports
    const reports = await SalesReport.find(combinedQuery)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    // Fetch total number of documents for pagination
    const total = await SalesReport.countDocuments(combinedQuery);
    //console.log("🚀 ~ getDetailedSalesReport ~ total:", total);

    // If no reports are found
    if (!reports.length) {
      return res
        .status(404)
        .json({ message: "No reports found for the given filters." });
    }

    // Return the reports along with pagination data
    res.status(200).json({
      reports,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Import reports data
const importReports = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);
  const reports = [];
  const invalidRows = [];
  const existingReports = [];
  const companyCode = req.user.companyCode;

  // Check that the user's company exists
  const company = await Company.findOne({ companyCode });
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on("data", (row, index) => {
      const {
        date,
        storeName,
        managerName,
        storeId,
        notes,
        images,
        "storeTotalSales.totalSalesLiters": totalSalesLiters,
        "storeTotalSales.totalSalesDollars": totalSalesDollars,
        ...productFields
      } = row;

      if (!date || !storeId) {
        invalidRows.push({
          row: index + 1,
          message: "Missing required fields: date or storeId",
        });
        return;
      }

      const formattedDate = new Date(date);

      const products = {
        PMS: {
          dippingTanks: [],
          pumps: [],
          totalSalesBreakdown: { pos: 0, cash: 0, expenses: 0 },
          totalSalesLiters: 0,
          totalSalesDollars: 0,
          actualTotal: 0,
          rate: 0,
        },
        DPK: {
          dippingTanks: [],
          pumps: [],
          totalSalesBreakdown: { pos: 0, cash: 0, expenses: 0 },
          totalSalesLiters: 0,
          totalSalesDollars: 0,
          actualTotal: 0,
          rate: 0,
        },
        AGO: {
          dippingTanks: [],
          pumps: [],
          totalSalesBreakdown: { pos: 0, cash: 0, expenses: 0 },
          totalSalesLiters: 0,
          totalSalesDollars: 0,
          actualTotal: 0,
          rate: 0,
        },
      };

      Object.keys(productFields).forEach((field) => {
        const fieldSegments = field.split(".");

        const category = fieldSegments[0];
        const product = fieldSegments[1];
        const index = parseInt(fieldSegments[2], 10);
        const attribute = fieldSegments[3];
        const subIndex = fieldSegments[4]
          ? parseInt(fieldSegments[4], 10)
          : undefined;

        if (products[product]) {
          if (category === "dippingTanks" && attribute) {
            if (!products[product].dippingTanks[index]) {
              products[product].dippingTanks[index] = {};
            }
            products[product].dippingTanks[index][attribute] = parseInt(
              productFields[field],
              10
            );
          } else if (category === "pumps" && attribute === "nozzles") {
            if (!products[product].pumps[index]) {
              products[product].pumps[index] = { nozzles: [] };
            }
            if (!products[product].pumps[index].nozzles[subIndex]) {
              products[product].pumps[index].nozzles[subIndex] = {};
            }
            products[product].pumps[index].nozzles[subIndex][fieldSegments[5]] =
              parseInt(productFields[field], 10);
          } else if (category === "totalSalesBreakdown") {
            const attributeName = fieldSegments[2]; // `pos`, `cash`, or `expenses`
            products[product].totalSalesBreakdown[attributeName] = parseInt(
              productFields[field],
              10
            );
          } else if (category === "rate") {
            products[product].rate = parseInt(productFields[field], 10);
          } else if (
            category === "totalSalesLiters" ||
            category === "totalSalesDollars" ||
            category === "actualTotal"
          ) {
            products[product][category] = parseInt(productFields[field], 10);
          }
        }
      });

      const parsedImages = images ? images.split(";") : [];

      reports.push({
        date: formattedDate,
        storeName,
        managerName,
        storeId,
        products,
        notes,
        images: parsedImages,
        companyCode,
        storeTotalSales: {
          totalSalesLiters: parseInt(totalSalesLiters, 10) || 0,
          totalSalesDollars: parseInt(totalSalesDollars, 10) || 0,
        },
        preparedBy: req.user._id,
      });
    })
    .on("end", async () => {
      try {
        for (let reportData of reports) {
          const { date, storeId, companyCode } = reportData;

          const existingReport = await SalesReport.findOne({
            date,
            storeId,
            companyCode,
          });

          if (existingReport) {
            existingReports.push({ date, storeId });
            continue;
          }

          await SalesReport.create(reportData);
        }

        res.status(201).json({
          message: "Reports imported successfully",
          count: reports.length - existingReports.length,
          invalidRows,
          existingReports,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error importing reports",
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

// Exporting the controller functions
module.exports = {
  createSalesReport,
  viewAllSalesReports,
  getSalesReportById,
  editSalesReport,
  deleteSalesReport,
  sortAndFilterReports,
  getDetailedSalesReport,
  getSalesReportsByStoreId,
  importReports,
};
