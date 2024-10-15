const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const Company = require("../models/companyModel"); // Assuming companyModel.js is in models folder
const crypto = require("crypto");

// @desc    Create a new company and also use the company owner details
// to create the first admin user for that company
// the admin can then add more admins or store managers
// @route   POST /api/companies
// @access any user
const createCompany = async (req, res) => {
  try {
    const { name, address, ownerName, ownerEmail, phone, planType, planCycle } =
      req.body;

    // Validation
    if (!name || !address || !ownerName || !ownerEmail || !phone) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    // Check if a company with the same ownerEmail already exists
    const existingCompany = await Company.findOne({ ownerEmail });

    if (existingCompany) {
      return res.status(400).json({
        message: "A company with this owner email already exists",
      });
    }

    // Generate a unique company code
    let companyCode;
    let isUnique = false;

    while (!isUnique) {
      companyCode = generateCompanyCode(name);
      const existingCompanyCode = await Company.findOne({ companyCode });

      if (!existingCompanyCode) {
        isUnique = true;
      }
    }

    // Create a new company (planCost, planExpiryDate, planRenewalDate are automatically calculated in the pre-save hook)
    const company = await Company.create({
      name,
      address,
      companyCode,
      ownerName,
      ownerEmail,
      phone,
      planType: planType || "Gold", // Default to Gold
      planCycle: planCycle || "Monthly", // Default to Monthly
    });

    if (!company) {
      res.status(400);
      throw new Error("Invalid company data");
    }

    // Prepare the email parameters
    const activationLink = `${process.env.FRONTEND_URL}/register`;
    const subject = "Welcome to Gas Station Pro! Let's Get You Started 🚀";
    const send_to = ownerEmail;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = process.env.REPLY_TO_EMAIL;
    const template = "companyRegistrationEmail"; // Name of the Handlebars template without extension
    const link = activationLink;
    const companyName = name;
    const storeName = "";
    const managerName = "";
    const reportDate = "";
    const updatedDate = "";
    const planCost = company.planCost;
    const planTier = company.planTier;
    const planRenewalDate = company.planRenewalDate;
    const planExpiryDate = company.planExpiryDate;

    // Send welcome email
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      template,
      name,
      link,
      companyCode,
      ownerName,
      companyName,
      storeName,
      managerName,
      reportDate,
      updatedDate,
      planType,
      planCost,
      planCycle,
      planTier,
      planRenewalDate,
      planExpiryDate
    );

    // If company creation and email are successful, return response
    res.status(201).json({
      name,
      address,
      companyCode,
      ownerName,
      ownerEmail,
      phone,
      planType: company.planType,
      planCycle: company.planCycle,
      planTier: company.planTier,
      planCost: company.planCost,
      planExpiryDate: company.planExpiryDate,
      planRenewalDate: company.planRenewalDate,
      message: "Company created successfully. Please check your email.",
    });
  } catch (error) {
    res
      .status(res.statusCode === 200 ? 500 : res.statusCode)
      .json({ message: error.message });
  }
};

// Helper function to generate a company code
const generateCompanyCode = (companyName) => {
  // Generate a 3 random number
  const randomNum = Math.floor(100 + Math.random() * 900);

  // Extract 2 random characters from the company name
  const sanitizedCompanyName = companyName
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase(); // Remove non-alphabetic characters and convert to uppercase
  let randomChars = "";

  if (sanitizedCompanyName.length >= 2) {
    randomChars = sanitizedCompanyName.slice(0, 2); // Take first 2 chars if company name is longer
  } else {
    randomChars = sanitizedCompanyName.padEnd(2, "X"); // Pad with 'X' if name length is less than 2
  }

  // Generate 2 random numbers
  const twoRandomNumbers = crypto.randomInt(10, 99); // Random number between 10 - 99

  return `CUQ-${randomNum}-${randomChars}-${twoRandomNumbers}`;
};

/* const createCompany = async (req, res) => {
  try {
    const { name, address, ownerName, ownerEmail, phone } = req.body;

    // Validation
    if (!name || !address || !ownerName || !ownerEmail) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    // Check if a company with the same ownerEmail already exists
    const existingCompany = await Company.findOne({ ownerEmail });

    if (existingCompany) {
      return res.status(400).json({
        message: "A company with this owner email already exists",
      });
    }

    // Generate a unique company code
    let companyCode;
    let isUnique = false;

    while (!isUnique) {
      companyCode = generateCompanyCode(name);
      const existingCompanyCode = await Company.findOne({ companyCode });

      if (!existingCompanyCode) {
        isUnique = true;
      }
    }

    // Create a new company
    const company = await Company.create({
      name,
      address,
      companyCode,
      ownerName,
      ownerEmail,
      phone,
    });

    if (!company) {
      res.status(400);
      throw new Error("Invalid company data");
    }

    // Configure welcome email
    const registrationLink = "http://localhost:3000/register";
    const activationLink = `${process.env.FRONTEND_URL}/register`;

    const message = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Dear ${ownerName},</h2>
        <p>Thank you for choosing <strong>Gas Station Pro</strong> to manage your gas stations efficiently on the cloud! We're excited to have you on board.</p>
        <p>Your company, <strong>${name}</strong>, has been successfully registered on our platform. Below, you'll find your unique Company Code and the link to get started:</p>
        <p><strong>Company Code:</strong> <span style="background-color: #f0f0f0; padding: 4px;">${companyCode}</span></p>
        <p><strong>Registration Link:</strong> <a href="${registrationLink}" style="color: #007bff;">Register Here</a></p>
        <h3>How to Get Started</h3>
        <ul>
          <li>Use your unique <strong>Company Code</strong> during registration to set up your user account.</li>
          <li>As the company owner, you will be automatically assigned the <strong>Admin</strong> role. This gives you full access to all features, including managing users, sales reports, and store information.</li>
          <li>Feel free to share your <strong>Company Code</strong> and registration link with your store managers. When they register, they will be set up as <strong>"Manager"</strong> users. You can also add users to your portal from your Admin page.</li>
        </ul>
        <p>As an Admin, you can also assign different roles to users in your company from the <strong>Manage Users</strong> page.</p>
        <h3>Need Help?</h3>
        <p>Our support team is available at any time to answer your questions and guide you through setting up. Visit our <a href="https://yourplatform.com/help" style="color: #007bff;">Help Center</a> or reach out to us at <a href="mailto:support@yourplatform.com" style="color: #007bff;">support@yourplatform.com</a>.</p>
        <p>Welcome aboard! Let's transform how you manage your gas stations.</p>
        <p>Regards,</p>
        <p><strong>The Gas Station Pro Team</strong></p>
        <p><a href="https://gasstationpro.com" style="color: #007bff;">Website</a> | <a href="https://gastationpro.com/help" style="color: #007bff;">Help Center</a></p>
        <p style="font-size: 0.9rem; color: #666;">P.S. Get started today to make the most out of Gas Station Pro's features, and streamline your station management effortlessly.</p>
      </div>
    `;

    const subject = "Welcome to Gas Station Pro! Let's Get You Started 🚀";
    const send_to = ownerEmail;
    const sent_from = process.env.EMAIL_USER;

    // Send activation email
    await sendEmail(subject, message, send_to, sent_from);

    // If company creation and email are successful, return response
    res.status(201).json({
      name,
      address,
      companyCode,
      ownerName,
      ownerEmail,
      phone,
      message: "Company created successfully. Welcome email sent.",
    });
  } catch (error) {
    res
      .status(res.statusCode === 200 ? 500 : res.statusCode)
      .json({ message: error.message });
  }
};

// Helper function to generate a company code
const generateCompanyCode = (companyName) => {
  // Generate a 3 random number
  const randomNum = Math.floor(100 + Math.random() * 900);

  // Extract 2 random characters from the company name
  const sanitizedCompanyName = companyName
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase(); // Remove non-alphabetic characters and convert to uppercase
  let randomChars = "";

  if (sanitizedCompanyName.length >= 2) {
    randomChars = sanitizedCompanyName.slice(0, 2); // Take first 2 chars if company name is longer
  } else {
    randomChars = sanitizedCompanyName.padEnd(2, "X"); // Pad with 'X' if name length is less than 2
  }

  // Generate 2 random numbers
  const twoRandomNumbers = crypto.randomInt(10, 99); // Random number between 10 - 99

  return `CUQ-${randomNum}-${randomChars}-${twoRandomNumbers}`;
};
 */
// end configure send welcome email
//     res.status(201).json({
//       message: "Company created successfully",
//       company,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating company",
//       error: error.message,
//     });
//   }
// };

// @desc    Update an existing company
// @route   PUT /api/companies/:id
// @access  Admin only. May need to change this once we implement users being able to pay through checkout
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      companyCode,
      ownerName,
      ownerEmail,
      phone,
      planType,
      planCycle,
      planTier, // Added planTier
    } = req.body;

    // Find the company by ID
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update the company's details with the new values or retain the existing ones
    company.name = name || company.name;
    company.address = address || company.address;
    company.companyCode = companyCode || company.companyCode;
    company.ownerName = ownerName || company.ownerName;
    company.ownerEmail = ownerEmail || company.ownerEmail;
    company.phone = phone || company.phone;

    // Update the planType, planCycle, and planTier if provided
    if (planType) {
      company.planType = planType;
    }
    if (planCycle) {
      company.planCycle = planCycle;
    }
    if (planTier) {
      company.planTier = planTier; // Added planTier check and update
    }

    // Save the updated company, the pre-save hook will automatically handle `planCost`, `planExpiryDate`, and `planRenewalDate`
    await company.save();

    res.status(200).json({
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating company",
      error: error.message,
    });
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
// @access  Admin only
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the company by ID
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Use findByIdAndDelete instead of deleteOne for simplicity
    await Company.findByIdAndDelete(id);

    res.status(200).json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting company",
      error: error.message,
    });
  }
};

// @desc    View all companies
// @route   GET /api/companies
// @access  Admin only
// we cna use pagination to get more data GET /api/companies?page=2&limit=20
// On initial load, fetch page=1&limit=20.
// When the user clicks "Next", increment the page parameter and make another request with page=2&limit=20.
// When the user clicks "Previous", decrement the page parameter and make another request.
// Use the below instead if we dont need pagination since we can do pagination ourself in frontend just like reports list
/* const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();

    res.status(200).json({
      message: "Companies retrieved successfully",
      companies,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving companies",
      error: error.message,
    });
  }
}; */

const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Pagination query parameters

    // Fetch companies with pagination and only return necessary fields
    const companies = await Company.find()
      .select(
        "name address ownerEmail companyCode planType planCycle planTier createdAt"
      ) // Project only necessary fields
      .limit(limit * 1) // Limit the number of companies per page
      .skip((page - 1) * limit) // Skip companies for pagination
      .sort({ createdAt: -1 }); // Sort by creation date (newest first)

    // Get the total number of companies for pagination purposes
    const totalCompanies = await Company.countDocuments();

    res.status(200).json({
      message: "Companies retrieved successfully",
      companies,
      totalCompanies,
      totalPages: Math.ceil(totalCompanies / limit), // Total number of pages
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving companies",
      error: error.message,
    });
  }
};

// @desc    Get a single company by ID
// @route   GET /api/companies/:id
// @access  Admin only
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    // Find the company by ID
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company retrieved successfully",
      data: company, // Change the key to `data` for consistency with other endpoints
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company",
      error: error.message,
    });
  }
};

// @desc    Get a company by companyCode
// @route   GET /api/companies/code/:companyCode
// @access  logged in user
/* const getCompanyByCode = async (req, res) => {
  try {
    const { companyCode } = req.params;

    const company = await Company.findOne({ companyCode });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company retrieved successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company",
      error: error.message,
    });
  }
}; */
const getCompanyByCode = async (req, res) => {
  try {
    const { companyCode } = req.params;

    // Validate if companyCode is provided and not empty
    if (!companyCode || companyCode.trim() === "") {
      return res.status(400).json({ message: "Company code is required" });
    }

    // Find the company by its code
    const company = await Company.findOne({ companyCode });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Optionally, exclude sensitive fields using `.select()` (if needed)
    // const company = await Company.findOne({ companyCode }).select("-sensitiveField");

    res.status(200).json({
      message: "Company retrieved successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company",
      error: error.message,
    });
  }
};

module.exports = {
  createCompany,
  updateCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyById,
  getCompanyByCode,
};
