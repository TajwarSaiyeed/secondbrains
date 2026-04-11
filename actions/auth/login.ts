import "server-only";
import { signIn } from "@/auth";
import { LoginFormValues } from "@/schema/auth-schema";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export const loginUser = async (
  values: LoginFormValues,
  callbackUrl?: string
) => {
  let doRedirect = false;
  try {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        status: false,
        statusCode: 401,
        message: "Invalid credentials",
        data: null,
      };
    }

    if (result) {
      doRedirect = true;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            status: false,
            statusCode: 401,
            message: "Invalid credentials",
            data: null,
          };
        default:
          return {
            status: false,
            statusCode: 500,
            message: "Authentication error",
            data: null,
          };
      }
    }

    return {
      status: false,
      statusCode: 500,
      message:
        "Internal server error: " +
        (error instanceof Error ? error.message : "unknown error"),
      data: null,
    };
  }

  if (doRedirect) {
    redirect(callbackUrl || "/dashboard");
  }
};
