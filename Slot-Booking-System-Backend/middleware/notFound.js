export const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
};
