import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
},{
    timestamps: true
})

const Post = mongoose.model('Post',postSchema)
export default Post