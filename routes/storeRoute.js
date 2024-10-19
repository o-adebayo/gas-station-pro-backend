const express = require("express");
const {
  createStore,
  viewStores,
  getStore, // Controller to get a specific store
  //getStoreByUserId,
  getStores,
  deleteStore,
  updateStore, // Controller to get all stores (for admins)
  updateStoreManager,
  importStores,
} = require("../controllers/storeController");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");
const { upload, uploadCSV } = require("../utils/fileUpload");

// Admin can create a store
router.post("/", protect(["admin"]), upload.single("image"), createStore);
//router.post("/", protect(["admin"]), upload.array("image"), createStore); //for multiple files e.g. sales report

// Admin can view all stores, manager can view their store(s) only
router.get("/", protect(["admin", "manager"]), viewStores);

//router.post("/batch", protect(["admin", "manager"]), viewStores);

// Route to get a specific store by storeId (admin can access any store, manager only their own store)
router.get("/:id", protect(["admin", "manager"]), getStore);

// Route to get store by the logged-in user's storeId
//router.get("/user-store", protect(["admin", "manager"]), getStoreByUserId);

// Route to delete a store
router.delete("/:id", protect(["admin"]), deleteStore);

router.post("/updateStoreManager", protect(["admin"]), updateStoreManager);

// Route to update a store
router.patch("/:id", protect(), upload.single("image"), updateStore);

// Uncomment if you need a separate route for getting all stores (for admins)
// router.get("/", protect(['admin']), getStores);

// route for importing store from csv
//router.post("/import", protect(["admin"]), upload.single("file"), importStores);
// For CSV file (import stores)
router.post(
  "/import-stores",
  protect(["admin"]),
  uploadCSV.single("csvFile"),
  importStores
);

module.exports = router;
