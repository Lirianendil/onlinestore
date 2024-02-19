const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    createProduct,
    getProducts,
    updateProduct,
} = require("../controllers/productController");
const router = express.Router();

router.post("/", protect, createProduct);
router.get("/", getProducts);
router.patch("/:productId", protect, updateProduct);

module.exports = router;