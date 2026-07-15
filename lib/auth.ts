import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "./prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// Zod Schema for input validation — login only needs non-empty fields
const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Simple In-Memory Rate Limiter
async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10; // Slightly more lenient for testing, still secure
  const windowStart = new Date(now.getTime() - windowMs);

  const recentFailures = await prisma.auditLog.count({
    where: {
      ipAddress: ip,
      action: { in: ['LOGIN_FAILED', 'RATE_LIMITED'] },
      createdAt: { gte: windowStart },
    },
  });

  return recentFailures < maxAttempts;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@chezkeke.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Robust Metadata Extraction
        const headers = req?.headers as any;
        const xForwardedFor = headers?.["x-forwarded-for"];
        const ip = xForwardedFor
          ? xForwardedFor.split(",").pop()?.trim() || "127.0.0.1"
          : headers?.["x-real-ip"] || "127.0.0.1";
        const userAgent = headers?.["user-agent"] || "Unknown Device";

        // 1. Rate Limiting Check + Logging
        if (!(await checkRateLimit(ip))) {
          await prisma.auditLog.create({
            data: {
              action: "RATE_LIMITED",
              ipAddress: ip,
              userAgent: userAgent,
            }
          });
          throw new Error("Rate limit exceeded. Please try again in 5 minutes.");
        }

        // 2. Validate using Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid input format.");
        }

        const { email, password } = parsed.data;

        // 3. Fetch User
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // 4. Case: Non-existent or Deactivated User
        if (!user || !user.isActive) {
          await prisma.auditLog.create({
            data: {
              action: "LOGIN_FAILED",
              ipAddress: ip,
              userAgent: userAgent,
              userId: user?.id, // null if user doesn't exist
            }
          });
          throw new Error("Invalid credentials.");
        }

        // 5. Case: Wrong Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              ipAddress: ip,
              userAgent: userAgent,
            }
          });
          throw new Error("Invalid credentials.");
        }

        // 6. Case: Success
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_SUCCESS",
            ipAddress: ip,
            userAgent: userAgent,
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (standard work shift)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  },
};
