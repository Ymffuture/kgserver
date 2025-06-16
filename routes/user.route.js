import express from "express"
import { getAllUsers, login, logout, register, updateProfile, googleLogin } from "../controllers/user.controller.js"
import { isAuthenticated } from "../middleware/isAuthenticated.js"
import { singleUpload } from "../middleware/multer.js"
const router = express.Router()

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").get(logout)
router.route("/profile/update").put(isAuthenticated, singleUpload, updateProfile)
router.get('/all-users', getAllUsers);
router.route('/auth/google-login').post(googleLogin);

export default router;
