export function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") {
    return response.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
}
