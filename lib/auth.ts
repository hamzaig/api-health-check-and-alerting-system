import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const STATIC_USER = {
  email: "admin@moonsys.co",
  password: "123123123",
  name: "Admin",
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (
          credentials.email === STATIC_USER.email &&
          credentials.password === STATIC_USER.password
        ) {
          return {
            id: "1",
            email: STATIC_USER.email,
            name: STATIC_USER.name,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});
