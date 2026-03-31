import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

/** Canonical site URL for OAuth callbacks; Auth.js reads AUTH_URL from the environment. */
const authUrl =
  process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
if (authUrl) {
  process.env.AUTH_URL = authUrl;
}

/** Auth.js requires a non-empty secret or it returns "Server error / server configuration". */
const authSecret =
  process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

if (process.env.NODE_ENV === "development" && !authSecret) {
  console.warn(
    "[auth] Set AUTH_SECRET (or NEXTAUTH_SECRET) in .env — sign-in will fail until it is set.",
  );
}

const googleEnabled =
  Boolean(process.env.GOOGLE_CLIENT_ID?.length) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET?.length);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev",
            name: "Dev Judge",
            credentials: {},
            authorize: async () => {
              const email = "dev@thegavel.local";
              const user = await prisma.user.upsert({
                where: { email },
                create: { email, name: "Dev Judge" },
                update: { name: "Dev Judge" },
              });
              return {
                id: user.id,
                email: user.email ?? email,
                name: user.name ?? "Dev Judge",
              };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials" && user.id) {
          token.sub = user.id;
        } else if (user.email) {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name ?? undefined,
              image: (user as { image?: string | null }).image,
            },
            update: {
              name: user.name ?? undefined,
              image: (user as { image?: string | null }).image,
            },
          });
          token.sub = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
