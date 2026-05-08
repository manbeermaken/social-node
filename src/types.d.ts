import { Request } from 'express';
import { type IPost } from '@/core/models/post.model.ts';

declare global {
  namespace Express {
    interface Request {
      post?: IPost;
      userId?: string;
      username?: string;
    }
  }
}