export function errorHandler(error, _request, response, _next) {
  console.error(error);

  return response.status(500).json({
    message: "Something went wrong on the server.",
  });
}
