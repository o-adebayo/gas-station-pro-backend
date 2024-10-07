const express = require("express");
const router = express.Router();
const {
  createSalesReport,
  viewAllSalesReports,
  getSalesReportById,
  editSalesReport,
  deleteSalesReport,
  sortAndFilterReports,
} = require("../controllers/salesReportController");
const protect = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");

// Route to create a new sales report
// Admins can create for any store in their company, Managers only for the stores they manage
router.post("/", protect(), upload.array("images"), createSalesReport);

// Route to view all sales reports
// Admins see all reports for their company, Managers only see reports for their managed stores
router.get("/", protect(), viewAllSalesReports);

// Route to get one sales report by ID
router.get("/:id", protect(), getSalesReportById);

// Route to edit a sales report
// Admins can edit any report in their company, Managers can only edit reports for their stores
router.patch("/:id", protect(), upload.array("images"), editSalesReport);

// Route to delete a sales report
// Only company owner (admin) can delete reports
router.delete("/:id", protect(["admin"]), deleteSalesReport);

// Route to sort and filter sales reports (admins and managers)
// Query parameters: sortBy (date, store, etc.), filterByStore, filterByManager
router.get("/filter", protect(), sortAndFilterReports);

module.exports = router;
