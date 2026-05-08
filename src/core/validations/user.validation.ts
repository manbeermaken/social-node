import * as z from "zod";

export const userValidationSchema = z.object({
  username: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Username is required"
          : "Invalid username type",
    })
    .min(3, { error: "Username must be atleast 3 characters long" })
    .trim()
    .max(100, { error: "Username cannot exceed 10 characters" }),

  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Password is required"
          : "Invalid password type",
    })
    .min(6, { error: "Password must be atleast 6 characters long" })
    .trim()
    .max(25, { error: "Password cannot exceed 25 characters" }),
});

export type UserType = z.infer<typeof userValidationSchema>