'use server'

import * as nodemailer from 'nodemailer'

export async function sendInviteEmail(
  email: string,
  boardTitle: string,
  inviteUrl: string,
  message?: string,
) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    const mailOptions = {
      from:
        process.env.EMAIL_FROM || '"SecondBrains" <noreply@secondbrains.com>',
      to: email,
      subject: `You've been invited to join ${boardTitle} on SecondBrains`,
      html: `
        <div>
          <h2>You're invited to collaborate!</h2>
          <p>You have been invited to join the board <strong>${boardTitle}</strong>.</p>
          ${message ? `<p>Message from the inviter: <em>"${message}"</em></p>` : ''}
          <p>Click the link below to accept the invite:</p>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send invite email:', error)
    return { error: error.message || 'Failed to send email' }
  }
}
