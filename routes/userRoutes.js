const Router = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    searchUsers,
} = require("../controllers/userController");
const router = Router();

router.get("/", getUsers);
router.get("/", searchUsers);
router.post("/", protect, createUser);
router.get("/:userId", getUserById);
router.patch("/:userId", protect, updateUser);
router.delete("/:userId", protect, deleteUser);

module.exports = router;