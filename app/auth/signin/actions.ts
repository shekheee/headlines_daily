"use server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function signInWithCredentials(
  email: string,
  password: string,
  redirectTo: string = "/admin"
): Promise<{ error: string } | undefined> {
  try {
    // redirect: false → NextAuth sets session cookie but does NOT throw NEXT_REDIRECT
    // We then redirect manually so Next.js handles it with a plain relative path
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
  // Ensure path is relative (strip any accidental origin prefix)
  const path = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;
  redirect(path);
}
