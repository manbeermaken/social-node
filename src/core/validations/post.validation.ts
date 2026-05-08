import * as z from "zod";

export const createPostSchema = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Post title is required"
          : "Invalid title type",
    })
    .min(1, { error: "Post title cannot be empty" })
    .trim()
    .max(100, { error: "Title cannot exceed 100 characters" }),

  content: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Post content is required"
          : "Invalid content type",
    })
    .min(1, { error: "Post content cannot be empty" }),

  authorId: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Author Id is required" : "Invalid Id type",
    })
    .min(1, { error: "Author Id cannot be empty" }),

  authorName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Author Name is required"
          : "Invalid Name type",
    })
    .min(1, { error: "Author Name cannot be empty" }),
});

export type PostType = z.infer<typeof createPostSchema>;

