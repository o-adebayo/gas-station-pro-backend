const mongoose = require("mongoose");
const moment = require("moment"); // For date handling

// Define the schema for the company model
const companySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    companyCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // New plan fields
    planType: {
      type: String,
      enum: ["Gold", "Platinum", "Enterprise"],
      default: "Gold",
    },
    planCycle: {
      type: String,
      enum: ["Monthly", "Yearly", "Special", "Unlimited"],
      default: "Monthly",
    },
    planTier: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
    },
    planCost: {
      type: Number,
      required: true,
      default: 0, // Automatically calculated
    },
    planExpiryDate: {
      type: Date,
    },
    planRenewalDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save hook to calculate planCost, planExpiryDate, and planRenewalDate
companySchema.pre("save", function (next) {
  const company = this;

  // Calculate planCost based on planType and planCycle
  const pricing = {
    Gold: { Monthly: 99.99, Yearly: 899.99, Unlimited: 3000 },
    Platinum: { Monthly: 129.99, Yearly: 1169.91, Unlimited: 5000 },
    Enterprise: { Monthly: 499.99, Yearly: 4499.91, Unlimited: 7000 },
  };

  const cost =
    pricing[company.planType] && pricing[company.planType][company.planCycle]
      ? pricing[company.planType][company.planCycle]
      : 0;

  company.planCost = cost;

  // Set planExpiryDate and planRenewalDate based on planCycle
  if (company.planCycle === "Monthly") {
    company.planExpiryDate = moment(company.createdAt).add(1, "month").toDate();
    company.planRenewalDate = moment(company.planExpiryDate)
      .subtract(1, "week")
      .toDate();
  } else if (company.planCycle === "Yearly") {
    company.planExpiryDate = moment(company.createdAt).add(1, "year").toDate();
    company.planRenewalDate = moment(company.planExpiryDate)
      .subtract(1, "week")
      .toDate();
  } else if (company.planCycle === "Special") {
    company.planExpiryDate = moment(company.createdAt)
      .add(3, "months")
      .toDate(); // Example for special plan
    company.planRenewalDate = moment(company.planExpiryDate)
      .subtract(1, "week")
      .toDate();
  } else if (company.planCycle === "Unlimited") {
    // Unlimited plan: Set expiry date to 100 years from creation
    company.planExpiryDate = moment(company.createdAt)
      .add(100, "years")
      .toDate();
    company.planRenewalDate = moment(company.planExpiryDate)
      .subtract(1, "week")
      .toDate();
  }

  next();
});

// Create and export the model
const Company = mongoose.model("Company", companySchema);

module.exports = Company;
