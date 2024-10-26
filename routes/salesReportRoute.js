const express = require("express");
const router = express.Router();
const {
  createSalesReport,
  viewAllSalesReports,
  getSalesReportById,
  editSalesReport,
  deleteSalesReport,
  sortAndFilterReports,
  getDetailedSalesReport,
  getSalesReportsByStoreId,
  importReports,
} = require("../controllers/salesReportController");
const protect = require("../middleWare/authMiddleware");
const { upload, uploadMultiple, uploadCSV } = require("../utils/fileUpload");

// Route to create a new sales report
// Admins can create for any store in their company, Managers only for the stores they manage
router.post("/", protect(), uploadMultiple.array("images"), createSalesReport);
// For multiple images (sales report images) example of use below
//router.post("/upload-multiple", protect(["admin", "user"]), uploadMultiple.array("images", 5), uploadSalesReportImages);

// Route to view all sales reports
// Admins see all reports for their company, Managers only see reports for their managed stores
router.get("/", protect(), viewAllSalesReports);

// New route for getting detailed sales reports with filters (query params)
router.get("/detailed-sales-report", protect(), getDetailedSalesReport);

// Route to get one sales report by ID
router.get("/:id", protect(), getSalesReportById);

// route to get alls ales report that belong to a store
router.get("/store/:storeId", protect(), getSalesReportsByStoreId);

// Route to edit a sales report
// Admins can edit any report in their company, Managers can only edit reports for their stores
router.patch(
  "/:id",
  protect(),
  uploadMultiple.array("images"),
  editSalesReport
);

// Route to delete a sales report
// Only company owner (admin) can delete reports
router.delete("/:id", protect(["admin", "manager"]), deleteSalesReport);

// Route to sort and filter sales reports (admins and managers)
// Query parameters: sortBy (date, store, etc.), filterByStore, filterByManager
router.get("/filter", protect(), sortAndFilterReports);

// For CSV file (import stores)
router.post(
  "/import-reports",
  protect(["admin"]),
  uploadCSV.single("csvFile"),
  importReports
);

module.exports = router;
