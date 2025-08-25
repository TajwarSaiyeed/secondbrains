"use server";

import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth-utils";

export async function sendPasswordResetEmail(values: { email: string }) {
  const email = values.email?.trim();

  if (!email) {
    return { status: false, statusCode: 400, message: "Email is required" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        status: true,
        statusCode: 200,
        message: "If the email exists, a reset link has been sent.",
      };
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetExpires },
    });

    if (
      process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD
    ) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_SERVER_USER,
        to: email,
        subject: "Reset your SecondBrains password",
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
            <p>You requested a password reset for your SecondBrains account.</p>
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

    return {
      status: true,
      statusCode: 200,
      message: "If the email exists, a reset link has been sent.",
    };
  } catch (error) {
    return {
      status: false,
      statusCode: 500,
      message: "Failed to send reset email",
    };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    return {
      status: false,
      statusCode: 400,
      message: "Token and new password are required",
    };
  }

  if (newPassword.length < 8) {
    return {
      status: false,
      statusCode: 400,
      message: "Password must be at least 8 characters long",
    };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    });

    if (!user) {
      return {
        status: false,
        statusCode: 400,
        message: "Invalid or expired reset token",
      };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetExpires: null },
    });

    return {
      status: true,
      statusCode: 200,
      message: "Password reset successful",
    };
  } catch (error) {
    return {
      status: false,
      statusCode: 500,
      message: "Failed to reset password",
    };
  }
}
