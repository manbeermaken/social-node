import Post from "../models/Post.js";
import User from "../models/User.js";

const getPostFromId = async (req, res, next) => {
    let post
    try {
        post = await Post.findById(req.params.id)
        if (post === null) {
            return res.status(404).json({ message: "cannot find post" })
        }
    } catch (e) {
        return res.status(500).json({ message: e.message })
    }
    res.post = post
    next()
}

const getAllPosts = async (req, res) => {
    const posts = await Post.find()
    const user = await User.find({ _id: req.userId })
    res.json(posts)
}

const getPost = [getPostFromId, (req, res) => {
    res.json(res.post)
}]

const createPost = async (req, res) => {
    let user
    try {
        user = await User.findOne({ _id: req.userId })
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        authorId: user._id,
        authorName: user.username
    })
    try {
        const newPost = await post.save()
        res.status(201).json(newPost)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

const updatePost = [getPostFromId, async (req, res) => {
    if (req.body.title != null) {
        res.post.title = req.body.title
    }
    if (req.body.content != null) {
        res.post.content = req.body.content
    }
    try {
        const updatedPost = await res.post.save()
        res.json(updatedPost)
    } catch (e) {
        res.status(400).json({ message: e.message })
    }
}]

const deletePost = [getPostFromId, async (req, res) => {
    try {
        await res.post.deleteOne()
        res.json({ message: "deleted post" })
    } catch (e) {
        res.status(500).json({ message: e.message })
    }
}]

export { getAllPosts, getPost, createPost, updatePost, deletePost }