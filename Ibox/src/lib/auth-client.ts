import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "http://192.168.1.12:5000"
});

export const { signIn, signOut, getSession } = authClient;
