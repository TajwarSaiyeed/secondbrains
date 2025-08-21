import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./schema/auth-schema";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import { verifyPassword } from "./lib/auth-utils";

export default {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        try {
          const user = await prisma.user.findFirst({
            where: {
              email: email,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isCorrectPassword = await verifyPassword(
            password,
            user.password
          );

          if (!isCorrectPassword) {
            return null;
          }

          user.password = undefined as unknown as string;

          return user;
        } catch (error) {
          console.error(
            "Authentication failed:",
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=CredentialsSignin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
