import Post from "../models/Post.js";
import type { IPost } from "../models/Post.js";
import type { Request, Response, NextFunction } from 'express';
import {prisma} from '../config/prisma.js'

interface CustomRequest extends Request{
    post?: IPost;
    userId?: string;
    username?: string;
}

const getPostFromId = async (req: CustomRequest, res: Response, next: NextFunction) => {
    let post
    try {
        post = await Post.findById(req.params.id)
        if (post === null) {
            return res.status(404).json({ message: "Cannot find post" })
        }
    } catch (err) {
        if(err instanceof Error){
            if (err.name === 'CastError') { return res.status(400).json({ message: "Invalid post ID format" }) }
            return res.status(500).json({ message: err.message })
        } else {
            return res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
    req.post = post
    next()
}

export async function getPosts(req: Request, res: Response){
    try {
        const limit = parseInt(req.query.limit as string) || 10
        const cursor = req.query.cursor as string
        let query: any = {}
        if(cursor){
            query.createdAt = { $lt : new Date(cursor) }
        }
        
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(limit+1)
            .lean()

        const hasNextPage = posts.length > limit 
        const results = hasNextPage ? posts.slice(0, -1) : posts;

        const nextCursor = hasNextPage 
        ? results[results.length - 1].createdAt 
        : null;

        res.status(200).json({
            posts: results,
            nextCursor,
        });
    } catch (err) {
        console.log("Error getting posts: ",err)
        if (err instanceof Error) {
            return res.status(500).json({ message: err.message })
        } else {
            return res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
}

export function getPost(req: CustomRequest, res: Response) {
    if (!req.post || !req.userId) {
        return res.status(401).json({ message: "Unauthorized or Post not found" });
    }
    res.json(req.post)
}

const getUserPosts = async (req: Request, res: Response) => {
    try {
        const { username } = req.params
        const user = await prisma.user.findUnique({
            where:{ username:String(username) },
            select:{ id:true }
        })

        if (!user) { return res.status(404).json({ message: 'User not found' }) }

        const limit = parseInt(req.query.limit as string) || 10
        const cursor = req.query.cursor as string
        let query: any = {
            authorId : user.id
        }

        if(cursor){
            query.createdAt = { $lt : new Date(cursor) }
        }

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .limit(limit+1)
                                .lean()

        const hasNextPage = posts.length > limit 
        const results = hasNextPage ? posts.slice(0, -1) : posts;

        const nextCursor = hasNextPage 
        ? results[results.length - 1].createdAt 
        : null;

        res.status(200).json({
            posts: results,
            nextCursor,
        });

    } catch (err) {
        console.error("Error in getUserPosts:", err)
        if (err instanceof Error) {
            res.status(500).json({ message: err.message })
        } else {
            res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
}

const createPost = async (req: CustomRequest, res: Response) => {
    try {
        const id = req.userId
        const user = await prisma.user.findUnique({
            where:{ id },
            select:{ id:true, username:true}
        })
        if (!user) { return res.status(404).json({ message: "User not found" }) }

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            authorId: user.id,
            authorName: user.username
        })
        
        const newPost = await post.save()
        res.status(201).json(newPost)
    } catch (err) {
        console.log("Error in creating posts: ",err)
        if(err instanceof Error){
        return res.status(400).json({ message: err.message })
        } else {
            res.status(500).json({ message: "An unexpected error occurred" })
        }
    }
}

export async function updatePost(req: CustomRequest, res: Response) {
    if (!req.post || !req.userId) {
        return res.status(401).json({ message: "Unauthorized or Post not found" });
    }
    if (req.post.authorId.toString() !== req.userId.toString()) { return res.status(403).json({ message: "not allowed" }) }
    if (req.body.title != null) {
        req.post.title = req.body.title
    }
    if (req.body.content != null) {
        req.post.content = req.body.content
    }
    try {
        const updatedPost = await req.post.save()
        res.json(updatedPost)
    } catch (err) {
        console.log("Error updating post: ",err)
        if(err instanceof Error){
        res.status(400).json({ message: err.message })
        } else {
            res.status(500).json({message: "An unexpected error occurred"})
        }
    }
}

export async function deletePost(req: CustomRequest, res: Response) {
    if (!req.post || !req.userId) {
        return res.status(401).json({ message: "Unauthorized or Post not found" });
    }
    if (req.post.authorId.toString() !== req.userId.toString()) { return res.status(403).json({ message: "not allowed" }) }
    try {
        await req.post.deleteOne()
        res.json({ message: "deleted post" })
    } catch (err) {
        console.log("Error deleting post: ",err)
        if(err instanceof Error){
        res.status(400).json({ message: err.message })
        } else {
            res.status(500).json({message: "An unexpected error occurred"})
        }
    }
}

export { createPost, getUserPosts, getPostFromId }