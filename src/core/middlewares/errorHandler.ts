import HttpError from "../utils/httpError.js";
import type { ErrorRequestHandler } from "express";

interface BodyParserError extends SyntaxError {
  status: number;
  statusCode: number;
  expose: boolean;
  body: string;
  type: string;
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof HttpError) {
    const statusCode = error.statusCode;

    req.log.warn(
      { err: error, details: error.details },
      `Client Error: ${error.message}`,
    );
    return res.status(statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  // handles bad JSON 
  const parseError = error as BodyParserError;
  if (
    parseError instanceof SyntaxError &&
    parseError.status === 400 &&
    "body" in parseError
  ) {
    req.log.warn(
      { err: parseError, details: parseError.body },
      `Client Error: ${parseError.body}`,
    );
    return res.status(400).json({
      message: "Invalid JSON payload format. Please check your request body.",
      details: parseError.message,
    });
  }

  // handles unexpected error and logs call stack 
  req.log.error({ err: error }, "Unhandled Server Error");
  return res.status(500).json({ message: "Something went wrong" });
};

export default errorHandler;
