import express from "express";
import { changePassword, changeUsername } from "../controllers/usersControllers.js";


const router = express.Router()

router.patch('/me', changeUsername)

router.put('/me/change-password', changePassword)

export default router