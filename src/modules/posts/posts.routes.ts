import express from "express";
import {
  createPost,
  deletePost,
  getPosts,
  getPost,
  updatePost,
  getPostFromId,
} from "./posts.controller.js";

const router = express.Router();

router.get("/", getPosts);

router.get("/:id", getPostFromId, getPost);

router.post("/", createPost);

router.patch("/:id", getPostFromId, updatePost);

router.delete("/:id", getPostFromId, deletePost);

export default router;

