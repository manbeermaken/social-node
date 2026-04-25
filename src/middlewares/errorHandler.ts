import HttpError from "../utils/httpError.js";
import type { ErrorRequestHandler } from "express";

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

  req.log.error({ err: error }, "Unhandled Server Error");
  return res.status(500).json({ message: "Something went wrong" });
};

export default errorHandler;
