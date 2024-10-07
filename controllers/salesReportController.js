const SalesReport = require("../models/salesReportModel");
const User = require("../models/userModel");
const Store = require("../models/storeModel");
const Company = require("../models/companyModel");
const sendEmail = require("../utils/sendEmail");

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
};

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
      // Only company owner can delete the sales report
      //await salesReport.remove();
      // Use deleteOne instead of remove to delete the report
      await SalesReport.deleteOne({ _id: req.params.id });
      res.status(200).json({ message: "Sales Report removed" });
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
