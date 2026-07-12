import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Requires RESEND_API_KEY to be set (sign up at resend.com, add the key to
 * Vercel's env vars, and verify a sending domain — or use their shared
 * onboarding domain for testing). Not one of the env vars set up at launch,
 * so this needs to be added before password-reset emails will actually send.
 */
function getResend() {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it in Vercel's env vars (see resend.com).");
  }
  cached = new Resend(apiKey);
  return cached;
}

/** The address password-reset emails are sent from. Override once a custom domain is verified in Resend. */
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "Armistead Academy <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Armistead Academy password",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1e1a19;">
        <h1 style="font-size: 20px;">Reset your password</h1>
        <p>Someone requested a password reset for this email address. If that was you, click below to choose a new password — this link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #c43030; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Reset password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change unless you click the link above and set a new one.</p>
      </div>
    `,
  });
}
