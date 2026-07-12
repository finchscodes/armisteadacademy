"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ActionState = { error?: string } | undefined;

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    return { error: "That email is already registered" };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, isAdmin: users.isAdmin });

  await createSession({ userId: user.id, isAdmin: user.isAdmin });
  redirect("/characters/new");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return { error: "No account found with that email" };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Incorrect password" };
  }

  await createSession({ userId: user.id, isAdmin: user.isAdmin });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const requestResetSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export type PasswordResetRequestState = { error?: string; success?: boolean } | undefined;

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Always returns the same success message regardless of whether the email
 * matches an account — otherwise this becomes a way to check which emails
 * are registered.
 */
export async function requestPasswordResetAction(
  _prevState: PasswordResetRequestState,
  formData: FormData
): Promise<PasswordResetRequestState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email } = parsed.data;
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${getSiteUrl()}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      // Still report success below — don't leak whether the send itself
      // failed, and don't block the response on it.
    }
  }

  return { success: true };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, password } = parsed.data;

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );

  if (!resetToken) {
    return { error: "This reset link is invalid or has expired — request a new one" };
  }

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, resetToken.userId));
  await createSession({ userId: resetToken.userId, isAdmin: user?.isAdmin ?? false });
  redirect("/");
}
