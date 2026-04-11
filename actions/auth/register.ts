import "server-only";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { RegisterFormValues, registerSchema } from "@/schema/auth-schema";
import { claimPendingInvitesByEmail } from "@/actions/boards";

export const registerUser = async (data: RegisterFormValues) => {
  try {
    const validationResult = registerSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        status: false,
        statusCode: 400,
        message: "Validation failed",
        data: null,
        errors: validationResult.error.flatten(),
      };
    }

    const { email, password: pass, name } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        status: false,
        statusCode: 409,
        message: "User already exists",
        data: null,
      };
    }

    if (!pass) {
      return {
        status: false,
        statusCode: 400,
        message: "Password is required",
        data: null,
      };
    }
    const passwordHash = await hashPassword(pass);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
      },
    });

    try {
      await claimPendingInvitesByEmail(user.id, user.email);
    } catch (e) {
      console.error("Failed to claim pending invites after register", e);
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      status: true,
      statusCode: 201,
      message: "User registered successfully",
      data: userWithoutPassword,
    };
  } catch (error: unknown) {
    return {
      status: false,
      statusCode: 500,
      message:
        "Internal server error: " +
        (error instanceof Error ? error.message : "unknown error"),
      data: null,
    };
  }
};
