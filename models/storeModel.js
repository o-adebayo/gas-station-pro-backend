const mongoose = require("mongoose");

const storeSchema = mongoose.Schema(
  {
    companyCode: {
      type: String,
      required: true,
    }, // Company unique code connecting the store to the company
    name: {
      type: String,
      required: [true, "Please add a Store name"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Please add a Store location"],
    },
    pumps: {
      type: Number,
      required: true,
    }, // Number of pumps
    nozzles: {
      type: Number,
      required: true,
    }, // Number of nozzles
    tanks: {
      type: Number,
      required: true,
    }, // Number of tanks
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User who is the store manager
      required: false, // The admin can assign the manager later
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: "https://i.ibb.co/4pDNDk1/avatar.png", // Default photo
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;
