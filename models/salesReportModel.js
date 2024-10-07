const mongoose = require("mongoose");

const salesReportSchema = mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      //unique: true, // Ensures only one report per day
    },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    companyCode: {
      type: String,
      required: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    managerName: {
      type: String,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store", // Assuming you have a Store model
      required: true,
    },
    products: {
      PMS: {
        dippingTanks: [
          {
            opening: { type: Number, required: true },
            closing: { type: Number, required: true },
            sales: { type: Number, required: true }, // This will be calculated
          },
        ],
        pumps: [
          {
            nozzles: [
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true }, // This will be calculated
              },
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true }, // This will be calculated
              },
            ],
          },
        ],
        totalSalesLiters: { type: Number, required: true },
        totalSalesDollars: { type: Number, required: true },
        actualTotal: { type: Number, required: true },
        rate: { type: Number, required: true }, // Rate per liter for PMS
        totalSalesBreakdown: {
          pos: { type: Number, required: true },
          cash: { type: Number, required: true },
          expenses: { type: Number, required: true },
        },
      },
      DPK: {
        dippingTanks: [
          {
            opening: { type: Number, required: true },
            closing: { type: Number, required: true },
            sales: { type: Number, required: true },
          },
        ],
        pumps: [
          {
            nozzles: [
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true },
              },
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true },
              },
            ],
          },
        ],
        totalSalesLiters: { type: Number, required: true },
        totalSalesDollars: { type: Number, required: true },
        actualTotal: { type: Number, required: true },
        rate: { type: Number, required: true }, // Rate per liter for DPK
        totalSalesBreakdown: {
          pos: { type: Number, required: true },
          cash: { type: Number, required: true },
          expenses: { type: Number, required: true },
        },
      },
      AGO: {
        dippingTanks: [
          {
            opening: { type: Number, required: true },
            closing: { type: Number, required: true },
            sales: { type: Number, required: true },
          },
        ],
        pumps: [
          {
            nozzles: [
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true },
              },
              {
                opening: { type: Number, required: true },
                closing: { type: Number, required: true },
                sales: { type: Number, required: true },
              },
            ],
          },
        ],
        totalSalesLiters: { type: Number, required: true },
        totalSalesDollars: { type: Number, required: true },
        actualTotal: { type: Number, required: true },
        rate: { type: Number, required: true }, // Rate per liter for AGO
        totalSalesBreakdown: {
          pos: { type: Number, required: true },
          cash: { type: Number, required: true },
          expenses: { type: Number, required: true },
        },
      },
    },
    storeTotalSales: {
      totalSalesLiters: { type: Number, required: true },
      totalSalesDollars: { type: Number, required: true },
    },
    images: [{ type: String }], // Array to store image URLs
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

const SalesReport = mongoose.model("SalesReport", salesReportSchema);

module.exports = SalesReport;
