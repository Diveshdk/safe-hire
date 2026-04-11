import { Resend } from 'resend'

// Resend client — initialized once at module level
const resend = new Resend(process.env.RESEND_API_KEY)

// Sender address must match your verified Resend domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'certificates@safe-hire.in'

interface SendCertificateEmailParams {
  to: string
  recipientName: string
  eventName: string
  certificateLink: string
  certificateType: string
  orgName: string
}

export async function sendCertificateEmail({
  to,
  recipientName,
  eventName,
  certificateLink,
  certificateType,
  orgName,
}: SendCertificateEmailParams) {
  console.log(`[Email] Attempting to send certificate email to: ${to} from: ${FROM_EMAIL}`)

  try {
    const { data, error } = await resend.emails.send({
      from: `SafeHire <${FROM_EMAIL}>`,
      to: [to],
      subject: `🎓 Your ${certificateType} Certificate — ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; background-color: #f4f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
              
              <!-- Header -->
              <div style="background-color: #18181b; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                <div style="display: inline-block; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 20px; margin-bottom: 16px;">
                  <span style="color: white; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Safe Hire</span>
                </div>
                <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Certificate Issuance Notification</p>
              </div>
              
              <!-- Body -->
              <div style="background: white; padding: 40px 32px; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 24px; font-weight: 700;">Congratulations, ${recipientName}! 🎉</h2>
                <p style="margin: 0 0 24px; color: #71717a; font-size: 15px;">You've received a new verified certificate.</p>
                
                <!-- Certificate Info Card -->
                <div style="background: #f9f9fb; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 40%;">Event</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${eventName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Issued By</td>
                      <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${orgName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Type</td>
                      <td style="padding: 8px 0;">
                        <span style="background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px;">
                          ${certificateType}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Status</td>
                      <td style="padding: 8px 0;">
                        <span style="background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px;">
                          ✓ Verified
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0 24px;">
                  <a href="${certificateLink}" 
                     style="display: inline-block; background-color: #18181b; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: -0.2px;">
                    View &amp; Download Certificate →
                  </a>
                </div>
                
                <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
                  Or paste this link in your browser:<br/>
                  <a href="${certificateLink}" style="color: #3b82f6; word-break: break-all;">${certificateLink}</a>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f9f9fb; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
                <p style="margin: 0 0 4px; color: #a1a1aa; font-size: 12px;">
                  This certificate is cryptographically secured by SafeHire.
                </p>
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                  © 2026 Safe Hire · <a href="https://safe-hire.in" style="color: #71717a;">safe-hire.in</a>
                </p>
              </div>
              
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Email] ❌ Resend API Error:', JSON.stringify(error, null, 2))
      return { success: false, error }
    }

    console.log(`[Email] ✅ Email sent successfully! ID: ${data?.id}, To: ${to}`)
    return { success: true, data }

  } catch (err: any) {
    console.error('[Email] ❌ Exception while sending email:', err?.message || err)
    return { success: false, error: err }
  }
}

