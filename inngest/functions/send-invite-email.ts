import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import nodemailer from "nodemailer";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Configure email transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP configuration incomplete, email sending disabled");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

export const sendInviteEmailJob = inngest.createFunction(
  {
    id: "send-invite-email",
    triggers: { event: "auth/send-invite-email" },
  },
  async ({ event, step }: any) => {
    const { boardId, email, userId, boardTitle, inviterName, message } =
      event.data;

    // 1. Fetch inviter details
    const inviter = await step.run("Fetch inviter details", async () => {
      try {
        return await convex.query(api.users.current, {});
      } catch (error) {
        console.error("Error fetching inviter details:", error);
        return { name: inviterName || "A SecondBrains user" };
      }
    });

    // 2. Generate invite token
    const inviteToken = await step.run("Generate invite token", async () => {
      try {
        const result = await convex.mutation(api.invites.generateInviteToken, {
          boardId,
        });
        return result.token;
      } catch (error) {
        console.error("Error generating invite token:", error);
        throw new Error("Failed to generate invite token");
      }
    });

    // 3. Build email HTML
    const emailHtml = step.run("Build email HTML", () => {
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://secondbrains.app"}/register?invite=${inviteToken}`;

      const hasCustomMessage = message && message.trim().length > 0;

      return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .message-text { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; }
        .social-links { margin: 20px 0; text-align: center; }
        .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 You're Invited to SecondBrains</h1>
        </div>
        <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviter.name || inviterName}</strong> has invited you to join a study board on <strong>SecondBrains</strong>:</p>
            
            <h2 style="color: #667eea; margin: 20px 0;">${boardTitle || "Study Board"}</h2>
            
            ${hasCustomMessage ? `<div class="message-text"><strong>Message from inviter:</strong><br>${message}</div>` : ""}
            
            <p>SecondBrains is an AI-powered collaborative study platform where you can:</p>
            <ul>
                <li>📝 Share notes and knowledge</li>
                <li>🔗 Collect and organize resources</li>
                <li>💬 Discuss topics with AI insights</li>
                <li>🤖 Get smart summaries of your content</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation & Join Board</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">Or copy this link: <br><code style="background: #eee; padding: 8px; border-radius: 4px; display: inline-block;">${inviteUrl}</code></p>
            
            <p>This invitation is valid for 7 days.</p>
        </div>
        <div class="footer">
            <p>© 2026 SecondBrains. Empowering collaborative learning with AI.</p>
            <div class="social-links">
                <a href="https://secondbrains.app">Website</a> • 
                <a href="mailto:support@secondbrains.app">Support</a>
            </div>
            <p>This email was sent to <strong>${email}</strong> because you were invited to join a SecondBrains board.</p>
        </div>
    </div>
</body>
</html>
      `;
    });

    // 4. Send email
    await step.run("Send email via SMTP", async () => {
      const transporter = getTransporter();

      if (!transporter) {
        console.warn(
          "Email service not configured, skipping email send for",
          email,
        );
        return {
          success: false,
          reason: "SMTP not configured",
          saved: false,
        };
      }

      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `${inviterName || "Someone"} invited you to "${boardTitle || "a study board"}" on SecondBrains`,
          html: emailHtml,
          replyTo: process.env.SMTP_REPLY_TO || undefined,
        });

        console.log("Email sent:", info.messageId);
        return {
          success: true,
          messageId: info.messageId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(
          `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    });

    // 5. Log the sent invitation
    await step.run("Log sent invitation", async () => {
      try {
        // Optional: Store in database for tracking
        // For now, just log
        console.log(
          `Invitation sent to ${email} for board ${boardId.toString()}`,
        );
      } catch (error) {
        console.error("Error logging invitation:", error);
      }
    });

    return {
      success: true,
      email,
      boardId: boardId.toString(),
      inviteToken,
      timestamp: new Date().toISOString(),
    };
  },
);
