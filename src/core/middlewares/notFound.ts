import type { RequestHandler } from "express";

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFound;
