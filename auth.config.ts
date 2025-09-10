import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./schema/auth-schema";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import { verifyPassword } from "./lib/auth-utils";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default {
  trustHost: true,
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
        if (user.id && isValidObjectId(user.id)) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        } else {
          return null;
        }
      }

      if (token.id && !isValidObjectId(token.id as string)) {
        return null;
      }

      return token;
    },
    async session({ token, session }) {
      if (token.id && session.user && isValidObjectId(token.id as string)) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
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
