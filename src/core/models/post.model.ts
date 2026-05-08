import mongoose, { Schema, Document } from "mongoose";
import { type PostType } from "../validations/post.validation.js";

export interface IPost extends PostType, Document {
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;