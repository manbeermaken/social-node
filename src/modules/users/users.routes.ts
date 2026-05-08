import express from "express";
import {
  changePassword,
  changeUsername,
  getUserPosts,
} from "./users.controller.js";

const router = express.Router();

router.patch("/me", changeUsername);

router.put("/me/change-password", changePassword);

router.get("/:username/posts", getUserPosts);

export default router;
