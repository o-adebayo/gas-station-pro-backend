const express = require("express");
const router = express.Router();
const {
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyById,
} = require("../controllers/companyController");
const protect = require("../middleWare/authMiddleware");

// Route to create a new company (Admin only)
router.post("/", protect(["super-admin"]), createCompany);

// Route to update a company by ID (Admin only)
router.put("/:id", protect(["super-admin"]), updateCompany);

// Route to delete a company by ID (Admin only)
router.delete("/:id", protect(["super-admin"]), deleteCompany);

// Route to view all companies (Admin only)
router.get("/", protect(["super-admin"]), getAllCompanies);

// Route to get a company by ID (Admin only)
router.get("/:id", protect(["super-admin"]), getCompanyById);

module.exports = router;
