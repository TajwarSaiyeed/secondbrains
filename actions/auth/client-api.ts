"use server";

import { LoginFormValues, RegisterFormValues } from "@/schema/auth-schema";
import { registerUser } from "./register";
import { loginUser } from "./login";

export const registerUserApi = async (values: RegisterFormValues) => {
  try {
    const result = await registerUser(values);
    return result;
  } catch (error) {
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

export const loginUserApi = async (
  values: LoginFormValues,
  callbackUrl?: string
) => {
  const result = await loginUser(values, callbackUrl);
  return result;
};
