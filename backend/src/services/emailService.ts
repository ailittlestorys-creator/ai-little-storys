import axios from "axios";

interface VerificationEmailProps {
  email: string;
  name: string;
  otp: string;
}

export const sendVerificationOtpEmail = async ({
  email,
  name,
  otp,
}: VerificationEmailProps): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "AI Little Stories";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo email configuration is missing");
  }

  const safeName = name.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="
        margin: 0;
        padding: 30px 10px;
        background: #f4f4f5;
        font-family: Arial, sans-serif;
      ">
        <div style="
          max-width: 500px;
          margin: auto;
          padding: 30px;
          background: #ffffff;
          border-radius: 12px;
        ">
          <h2 style="color: #2563eb;">
            AI Little Stories
          </h2>

          <h3>Hello ${safeName}!</h3>

          <p>
            Thank you for registering with AI Little Stories.
            Use the OTP below to verify your email address.
          </p>

          <div style="
            margin: 25px 0;
            padding: 18px;
            text-align: center;
            background: #eff6ff;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #2563eb;
          ">
            ${otp}
          </div>

          <p>
            This OTP expires in <strong>10 minutes</strong>.
          </p>

          <p>
            Do not share this OTP with anyone.
          </p>

          <hr />

          <p style="font-size: 12px; color: #777;">
            If you did not create this account,
            you can ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email,
          name,
        },
      ],
      subject: "Verify Your Email - AI Little Stories",
      htmlContent,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    },
  );
};
interface PasswordResetEmailProps {
  email: string;
  name: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}: PasswordResetEmailProps): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "AI Little Stories";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo email configuration is missing");
  }

  const safeName = name.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

  const safeResetUrl = resetUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:30px 10px;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:auto;padding:30px;background:#ffffff;border-radius:12px;">
          <h2 style="color:#2563eb;">AI Little Stories</h2>

          <h3>Hello ${safeName}!</h3>

          <p>We received a request to reset your password.</p>

          <p>Click the button below to create a new password.</p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${safeResetUrl}"
              style="background:#2563eb;color:#ffffff;padding:14px 25px;text-decoration:none;border-radius:8px;font-weight:bold;">
              Reset Password
            </a>
          </div>

          <p>This link expires in <strong>15 minutes</strong>.</p>

          <p>If you did not request a password reset, ignore this email.</p>

          <hr />

          <p style="font-size:12px;color:#777;">
            AI Little Stories
          </p>
        </div>
      </body>
    </html>
  `;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email, name }],
      subject: "Reset Your Password - AI Little Stories",
      htmlContent,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    },
  );
};
