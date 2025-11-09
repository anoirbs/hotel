import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn('SMTP not configured. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

export async function sendVerificationEmail(
  email: string,
  token: string,
  origin: string
): Promise<string> {
  const verificationUrl = `${origin}/api/auth/verify-email?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    // In development, log the URL instead of sending email
    console.log('📧 Verification email would be sent to:', email);
    console.log('🔗 Verification URL:', verificationUrl);
    return verificationUrl;
  }

  const mailOptions = {
    from: `"Hotel Paradise" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - Hotel Paradise',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Hotel Paradise</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #8B4513; margin-top: 0;">Verify Your Email Address</h2>
            <p>Thank you for signing up with Hotel Paradise!</p>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #8B4513; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Hotel Paradise. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Email - Hotel Paradise

      Thank you for signing up with Hotel Paradise!

      Please click the link below to verify your email address:
      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't create an account, please ignore this email.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return verificationUrl;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    // In development, still return the URL even if sending fails
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Verification URL (fallback):', verificationUrl);
      return verificationUrl;
    }
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  origin: string
): Promise<string> {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    // In development, log the URL instead of sending email
    console.log('📧 Password reset email would be sent to:', email);
    console.log('🔗 Reset URL:', resetUrl);
    return resetUrl;
  }

  const mailOptions = {
    from: `"Hotel Paradise" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your Password - Hotel Paradise',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Hotel Paradise</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #8B4513; margin-top: 0;">Reset Your Password</h2>
            <p>We received a request to reset your password for your Hotel Paradise account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #8B4513; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 20px; font-style: italic;">
              For security reasons, never share this link with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Hotel Paradise. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Reset Your Password - Hotel Paradise

      We received a request to reset your password for your Hotel Paradise account.

      Please click the link below to reset your password:
      ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email and your password will remain unchanged.

      For security reasons, never share this link with anyone.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return resetUrl;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    // In development, still return the URL even if sending fails
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Reset URL (fallback):', resetUrl);
      return resetUrl;
    }
    throw error;
  }
}

