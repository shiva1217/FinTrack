import { findUserById } from "../data/dataAccess.js";
import { verifyAuthToken } from "../utils/tokens.js";

export async function requireAuth(request, response, next) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Authentication required." });
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.userId);

    if (!user) {
      return response.status(401).json({ message: "User not found." });
    }

    request.user = user;
    next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
}
