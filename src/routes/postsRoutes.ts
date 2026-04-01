import express from "express";
import { createPost, deletePost, getAllPosts, getPost, getUserPosts, updatePost,getPostFromId } from "../controllers/postsControllers.js";

const router = express.Router()

router.get('/', getAllPosts)

router.get('/user/:username',getUserPosts)

router.get('/:id',getPostFromId, getPost)

router.post('/', createPost)

router.patch('/:id', getPostFromId, updatePost)

router.delete('/:id', getPostFromId, deletePost)



export default router