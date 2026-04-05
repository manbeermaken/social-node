import express from "express";
import { createPost, deletePost, getPosts, getPost, getUserPosts, updatePost,getPostFromId } from "../controllers/postsControllers.js";

const router = express.Router()

router.get('/', getPosts)

router.get('/user/:username',getUserPosts)

router.get('/:id',getPostFromId, getPost)

router.post('/', createPost)

router.patch('/:id', getPostFromId, updatePost)

router.delete('/:id', getPostFromId, deletePost)



export default router