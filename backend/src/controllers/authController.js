import bcrypt from "bcryptjs";

import {
  createUser,
  deleteUserAccount,
  findUserByEmail,
  findUserByUsername,
  updateUser,
} from "../data/dataAccess.js";
import { createAuthToken } from "../utils/tokens.js";

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    profilePicture: user.profilePicture || "",
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signUp(request, response) {
  const email = request.body.email?.trim().toLowerCase();
  const password = request.body.password?.trim();

  if (!email || !password) {
    return response.status(400).json({
      message: "Email and password are required.",
    });
  }

  if (password.length < 6) {
    return response.status(400).json({
      message: "Password must be at least 6 characters long.",
    });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return response.status(409).json({
      message: "An account with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ email, passwordHash });
  const token = createAuthToken(user._id.toString());

  return response.status(201).json({
    message: "Account created successfully.",
    token,
    user: sanitizeUser(user),
  });
}

export async function signIn(request, response) {
  const email = request.body.email?.trim().toLowerCase();
  const password = request.body.password?.trim();

  if (!email || !password) {
    return response.status(400).json({
      message: "Email and password are required.",
    });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return response.status(401).json({
      message: "Invalid email or password.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return response.status(401).json({
      message: "Invalid email or password.",
    });
  }

  const token = createAuthToken(user._id.toString());

  return response.json({
    message: "Signed in successfully.",
    token,
    user: sanitizeUser(user),
  });
}

export async function getCurrentUser(request, response) {
  return response.json({
    user: sanitizeUser(request.user),
  });
}

export async function updateProfile(request, response) {
  const name = request.body.name?.trim() || "";
  const username = request.body.username?.trim().toLowerCase() || "";
  const phone = request.body.phone?.trim() || "";
  const profilePicture = request.body.profilePicture?.trim() || "";

  if (username) {
    const existingUser = await findUserByUsername(username);
    if (existingUser && existingUser._id.toString() !== request.user._id.toString()) {
      return response.status(409).json({ message: "This username is already taken." });
    }
  }

  const updatedUser = await updateUser({
    userId: request.user._id,
    updates: { name, username, phone, profilePicture },
  });

  return response.json({
    message: "Profile updated successfully.",
    user: sanitizeUser(updatedUser),
  });
}

export async function changeEmail(request, response) {
  const email = request.body.email?.trim().toLowerCase();
  const password = request.body.password?.trim();

  if (!email || !password) {
    return response.status(400).json({ message: "Email and current password are required." });
  }

  const passwordMatches = await bcrypt.compare(password, request.user.passwordHash);
  if (!passwordMatches) {
    return response.status(401).json({ message: "Current password is incorrect." });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser && existingUser._id.toString() !== request.user._id.toString()) {
    return response.status(409).json({ message: "An account with this email already exists." });
  }

  const updatedUser = await updateUser({
    userId: request.user._id,
    updates: { email },
  });

  return response.json({
    message: "Email updated successfully.",
    user: sanitizeUser(updatedUser),
  });
}

export async function changePassword(request, response) {
  const currentPassword = request.body.currentPassword?.trim();
  const nextPassword = request.body.nextPassword?.trim();

  if (!currentPassword || !nextPassword) {
    return response.status(400).json({ message: "Current password and new password are required." });
  }

  if (nextPassword.length < 6) {
    return response.status(400).json({ message: "New password must be at least 6 characters long." });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, request.user.passwordHash);
  if (!passwordMatches) {
    return response.status(401).json({ message: "Current password is incorrect." });
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);
  await updateUser({
    userId: request.user._id,
    updates: { passwordHash },
  });

  return response.json({ message: "Password updated successfully." });
}

export async function deleteAccount(request, response) {
  const password = request.body.password?.trim();

  if (!password) {
    return response.status(400).json({ message: "Password is required to delete the account." });
  }

  const passwordMatches = await bcrypt.compare(password, request.user.passwordHash);
  if (!passwordMatches) {
    return response.status(401).json({ message: "Current password is incorrect." });
  }

  await deleteUserAccount({ userId: request.user._id });
  return response.json({ message: "Account deleted successfully." });
}
