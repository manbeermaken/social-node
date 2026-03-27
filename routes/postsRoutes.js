import express from "express";
import { createPost, deletePost, getAllPosts, getPost, getUserPosts, updatePost } from "../controllers/postsControllers.js";

const router = express.Router()

router.get('/', getAllPosts)

router.get('/user/:username',getUserPosts)

router.get('/:id', getPost)

router.post('/', createPost)

router.patch('/:id', updatePost)

router.delete('/:id', deletePost)



export default router