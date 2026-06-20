import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendStudyRoomJoinNotification(
  ownerEmail: string,
  ownerName: string,
  newMemberName: string,
  roomName: string
) {
  // If RESEND_API_KEY is not set, log a warning and return early.
  // This prevents crashes for users who haven't set up the key yet.
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email notification skipped.");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const data = await resend.emails.send({
      from: "StudyEezy <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `New member joined ${roomName}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Hello, ${ownerName}!</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Great news! <strong>${newMemberName}</strong> has just joined your study room: <strong>${roomName}</strong>.
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">
            Head over to StudyEezy to start learning together!
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>You received this email because you have Email Notifications turned on in your StudyEezy Profile.</p>
          </div>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email notification:", error);
    return { success: false, error };
  }
}
