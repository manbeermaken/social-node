import mongoose from "mongoose";
import * as z from 'zod'

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid cursor format",
  });
  
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: objectIdSchema.optional(),
});

export default paginationSchema