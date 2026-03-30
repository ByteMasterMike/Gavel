import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const googleEnabled =
  Boolean(process.env.GOOGLE_CLIENT_ID?.length) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET?.length);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
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
