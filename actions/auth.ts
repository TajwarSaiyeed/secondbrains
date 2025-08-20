"use server";

import "server-only";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { createSession } from "@/lib/redis";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const db = await getDb();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await hashPassword(password);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sessionId = await createSession(result.insertedId.toString());
    await setSessionCookie(sessionId);
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to create account" };
  }

  redirect("/dashboard");
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user || !(await verifyPassword(password, user.password))) {
      return { error: "Invalid email or password" };
    }

    const sessionId = await createSession(user._id.toString());
    await setSessionCookie(sessionId);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Failed to log in" };
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  await clearSessionCookie();
  redirect("/");
}

export async function clearUserSession() {
  await clearSessionCookie();
  return { success: true };
}

export async function sendPasswordResetEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetExpires,
          updatedAt: new Date(),
        },
      }
    );

    // Send email (you'll need to configure SMTP)
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/reset-password/${resetToken}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Reset your MindMesh password",
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
            <p>You requested a password reset for your MindMesh account.</p>
            <p>Click the link below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to send reset email" };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    return { error: "Token and new password are required" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return { error: "Invalid or expired reset token" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: "",
          resetExpires: "",
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password" };
  }
}
