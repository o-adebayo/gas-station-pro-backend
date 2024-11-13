const asyncHandler = require("express-async-handler");
const Store = require("../models/storeModel");
const User = require("../models/userModel");
const Company = require("../models/companyModel"); // Import the Company model
const { fileSizeFormatter } = require("../utils/fileUpload");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary").v2;
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");

const createStore = asyncHandler(async (req, res) => {
  const {
    name,
    location,
    pumps,
    nozzles,
    tanks,
    managerEmail,
    description,
    //image,
  } = req.body;

  // Validation
  if (!name || !location || !pumps || !nozzles || !tanks) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Retrieve the admin user's company code from the authenticated user
  const companyCode = req.user.companyCode;

  // Retrieve the company information using the companyCode
  const company = await Company.findOne({ companyCode });
  if (!company) {
    res.status(404);
    throw new Error("Company not found. Please check the company code.");
  }

  const companyName = company.name; // Get the company name from the Company model

  //console.log("Manager Email Provided:", managerEmail);

  // Check if the admin has provided a manager email
  let managerId = null;
  let manager = null;
  if (managerEmail) {
    // Find the user with the provided email
    manager = await User.findOne({ email: managerEmail });
    //console.log("Manager Found");

    if (!manager) {
      return res
        .status(404)
        .json({ message: "Manager with this email not found" });
    }

    // Ensure the user has a manager role
    if (manager.role !== "manager") {
      return res.status(400).json({
        message:
          "The user must have a manager role to be assigned as a store manager",
      });
    }

    // Set the managerId to the found user's _id
    managerId = manager._id;
  }

  // Handle Image upload
  // this is now done from the frontend
  let fileData = {};
  if (req.file) {
    // Construct the folder path dynamically based on the company name and store name
    const folderPath = `Gas Station Pro/Companies/${companyName}/Store/${name}`;

    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath, // Use the dynamically generated folder path
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Store
  const store = await Store.create({
    companyCode, // Automatically use admin's company code
    name,
    location,
    pumps,
    nozzles,
    tanks,
    managerId,
    image: fileData,
    description,
    //image,
  });

  // If a manager was assigned, update the manager's storeId field
  if (managerId) {
    manager.storeId = store._id;
    await manager.save();
  }

  res.status(201).json({ message: "Store created successfully", store: store });
});

// Get all stores
// THE VIEW STORES CONTROLLER FUNCTION DOES THIS SAME THING BUT BETTER FOR MY OWN PROJECT
// SO I WILL CALL THAT INSTEAD
const getStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({ managerId: req.user.id }).sort(
    "-createdAt"
  );
  res.status(200).json(stores);
});

// Controller function to view stores (admin and manager logic)
const viewStores = async (req, res) => {
  try {
    // Retrieve the authenticated user (admin or manager)
    const user = await User.findById(req.user._id);

    // If the user is an admin, return all stores for the company
    if (user.role === "admin") {
      const stores = await Store.find({ companyCode: user.companyCode });

      if (!stores.length) {
        return res
          .status(404)
          .json({ message: "No stores found for this company" });
      }

      return res.status(200).json({ stores });
    }

    // If the user is a manager, return only their assigned store
    // This is assuming only 1 unique manager per store
    // if a manager can manage multiple stores, then we just use Store.find instead of findOne
    if (user.role === "manager") {
      const store = await Store.findOne({
        companyCode: user.companyCode,
        managerId: user._id, // The store the manager is assigned to
      });

      if (!store) {
        return res
          .status(404)
          .json({ message: "No store found for this manager" });
      }

      return res.status(200).json({ store });
    }

    return res.status(403).json({ message: "Unauthorized access" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

/// Get a single store by storeId
const getStore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the store by its ID
  const store = await Store.findById(id).populate("managerId", "name email");

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  // Check if the user has access to this store (admin can access all, managers only their own store)
  if (
    req.user.role === "manager" &&
    store.managerId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Unauthorized to view this store");
  }

  // Return store details
  res.status(200).json(store);
});

/* const getStoreByUserId = asyncHandler(async (req, res) => {
  try {
    // Retrieve storeId from the logged-in user's profile
    const { storeId, role, _id } = req.user;

    // Ensure the user has a storeId
    if (!storeId) {
      return res
        .status(400)
        .json({ message: "No store associated with this user." });
    }

    // Find the store by its storeId
    const store = await Store.findById(storeId).populate(
      "managerId",
      "name email"
    );

    // If store is not found
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Authorization check: Managers can only access their own store
    if (
      role === "manager" &&
      store.managerId._id.toString() !== _id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this store" });
    }

    // If authorized, return the store data
    return res.status(200).json(store);
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ message: error.message });
  }
});
 */
// Get batch Stores
const getBatchStores = asyncHandler(async (req, res) => {
  try {
    const { storeIds } = req.body;
    const stores = await Store.find({ _id: { $in: storeIds } });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stores" });
  }
});

// Controller to update a store and assign or change the manager
const updateStoreManager = async (req, res) => {
  try {
    const { managerEmail, storeId } = req.body;

    // Find the store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Find the user with the provided email
    const manager = await User.findOne({ email: managerEmail });
    if (!manager) {
      return res
        .status(404)
        .json({ message: "Manager with this email not found" });
    }

    // Ensure the user has a manager role
    if (manager.role !== "manager") {
      return res.status(400).json({
        message:
          "The user must have a manager role to be assigned as a store manager",
      });
    }

    // Update the store with the new managerId
    store.managerId = manager._id;
    await store.save();

    // Prepare email details
    const subject = "You Have Been Assigned as Store Manager";
    const template = "ManagerAssignmentNotificationEmail"; // React Email template component name
    const name = manager.name;
    const link = `${process.env.FRONTEND_URL}/store/${store._id}`; // Link to view the store details

    // Send notification email
    try {
      await sendEmail({
        subject,
        send_to: managerEmail,
        template,
        name,
        link,
      });
      console.log("Manager assignment email sent successfully.");
    } catch (error) {
      console.error("Error sending manager assignment email:", error);
    }

    res
      .status(200)
      .json({ message: "Store manager updated successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete Store
const deleteStore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is an admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Only admins can delete stores.");
  }

  // Find the store to delete
  const store = await Store.findById(id);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  // Check if the store belongs to the admin's company
  if (store.companyCode !== req.user.companyCode) {
    res.status(403);
    throw new Error(
      "Access denied. You can only delete stores belonging to your company."
    );
  }

  // Delete the store using the model method
  await Store.deleteOne({ _id: id });

  res.status(200).json({ message: "Store deleted successfully" });
});

// Update Store
const updateStore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { storeName, storeLocation, pumps, nozzles, tanks, managerEmail } =
    req.body;

  // Find the store to update
  const store = await Store.findById(id);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  let manager; // Define manager outside of the conditional block

  // Check if user is an admin or a manager
  if (req.user.role === "admin") {
    // Admins can update any store that belongs to their company
    if (store.companyCode !== req.user.companyCode) {
      res.status(403);
      throw new Error(
        "Access denied. You can only update stores belonging to your company."
      );
    }

    // If managerEmail is provided, find the corresponding manager
    if (managerEmail) {
      manager = await User.findOne({
        email: managerEmail,
        role: "manager",
      });

      if (!manager) {
        res.status(404);
        throw new Error("Manager not found");
      }

      // Ensure the manager belongs to the same company as the admin
      if (manager.companyCode !== req.user.companyCode) {
        res.status(403);
        throw new Error("This manager does not belong to your company.");
      }
    }
  } else if (req.user.role === "manager") {
    // Managers can only update stores assigned to them
    if (
      store.companyCode !== req.user.companyCode ||
      store.managerId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Access denied. You can only update your assigned stores."
      );
    }

    // Managers should not be able to change the store manager
    if (managerEmail) {
      res.status(403);
      throw new Error(
        "Access denied. Only admins can change the store manager."
      );
    }
  } else {
    res.status(403);
    throw new Error("Access denied.");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Gas Station Pro",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update the store with the new data
  const updatedStore = await Store.findByIdAndUpdate(
    { _id: id },
    {
      storeName: storeName || store.storeName,
      storeLocation: storeLocation || store.storeLocation,
      pumps: pumps || store.pumps,
      nozzles: nozzles || store.nozzles,
      tanks: tanks || store.tanks,
      managerId: manager ? manager._id : store.managerId, // Only update managerId if manager is defined
      image: Object.keys(fileData).length === 0 ? store?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ message: "Store updated successfully", updatedStore });
});

// Import Stores from CSV
const importStores = asyncHandler(async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);

  const stores = [];
  const invalidRows = [];
  const existingStores = [];
  const companyCode = req.user.companyCode; // Use the companyCode from the authenticated user

  // Ensure the company exists
  const company = await Company.findOne({ companyCode });
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  // Read and parse the CSV file
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true })) // Use the first row of the CSV as headers
    .on("data", (row, index) => {
      // Validate each row and push it to the stores array
      const {
        name,
        location,
        pumps,
        nozzles,
        tanks,
        managerEmail,
        description,
      } = row;

      // Basic validation for required fields
      if (!name || !location || !pumps || !nozzles || !tanks) {
        invalidRows.push({
          row: index + 1,
          message:
            "Missing required fields: name, location, pumps, nozzles, tanks",
        });
        return; // Skip this row and continue processing other rows
      }

      stores.push({
        name,
        location,
        pumps: parseInt(pumps, 10),
        nozzles: parseInt(nozzles, 10),
        tanks: parseInt(tanks, 10),
        managerEmail,
        description,
        companyCode, // Use the authenticated user's company code
      });
    })
    .on("end", async () => {
      // Process and insert valid stores into the database
      try {
        for (let storeData of stores) {
          const {
            name,
            location,
            pumps,
            nozzles,
            tanks,
            managerEmail,
            description,
            companyCode,
          } = storeData;

          // Check if a store with the same name and location already exists for this company
          const existingStore = await Store.findOne({
            name,
            location,
            companyCode,
          });

          if (existingStore) {
            existingStores.push({ name, location });
            continue; // Skip this store if it already exists
          }

          // Find the manager based on email, if provided
          let managerId = null;
          if (managerEmail) {
            const manager = await User.findOne({ email: managerEmail });
            if (manager && manager.role === "manager") {
              managerId = manager._id;
            }
          }

          // Create the store
          await Store.create({
            name,
            location,
            pumps,
            nozzles,
            tanks,
            managerId,
            companyCode,
            description,
          });
        }

        // Send the response, including invalid rows and existing stores (if any)
        res.status(201).json({
          message: "Stores imported successfully",
          count: stores.length - existingStores.length, // Count of newly added stores
          invalidRows, // Include invalid rows in the response
          existingStores, // Include skipped existing stores
        });
      } catch (error) {
        res.status(500).json({
          message: "Error importing stores",
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

module.exports = {
  createStore,
  updateStoreManager,
  viewStores,
  getStore,
  //getStoreByUserId,
  getStores,
  deleteStore,
  updateStore,
  getBatchStores,
  importStores,
};
