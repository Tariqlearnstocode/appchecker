import { Resend } from 'resend';
import { escapeHtml } from './sanitize';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'IncomeChecker.com <noreply@yourdomain.com>';

export interface SendVerificationEmailParams {
  to: string;
  individualName: string;
  requestedByName: string;
  requestedByEmail: string | null;
  verificationLink: string;
  purpose?: string | null;
}

export interface SendCompletionEmailParams {
  to: string;
  individualName: string;
  requestedByName: string;
  verificationLink: string;
}

export interface SendReminderEmailParams {
  to: string;
  individualName: string;
  requestedByName: string;
  verificationLink: string;
  daysRemaining: number;
}

/**
 * Send verification link email to applicant
 */
export async function sendVerificationEmail(params: SendVerificationEmailParams) {
  const { to, individualName, requestedByName, requestedByEmail, verificationLink, purpose } = params;

  // Escape all user-provided input for HTML
  const safeIndividualName = escapeHtml(individualName);
  const safeRequestedByName = escapeHtml(requestedByName);
  const safeRequestedByEmail = requestedByEmail ? escapeHtml(requestedByEmail) : '';
  const safePurpose = purpose ? escapeHtml(purpose) : '';
  const safeTo = escapeHtml(to);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${requestedByName} has requested your income verification`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">IncomeChecker.com Request</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-top: 0;">Hello ${safeIndividualName},</p>
              
              <p style="font-size: 16px;">
                <strong>${safeRequestedByName}</strong>${safeRequestedByEmail ? ` (${safeRequestedByEmail})` : ''} has requested your income verification.
                ${safePurpose ? ` This verification is for: <strong>${safePurpose}</strong>` : ''}
              </p>
              
              <p style="font-size: 16px;">
                To complete this verification, please securely connect your bank account using the link below. 
                This process takes just a few minutes and your bank credentials are never stored.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Connect Your Bank Account
                </a>
              </div>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #065f46;">
                  <strong>🔒 Secure & Private:</strong> Your bank login credentials are never stored. 
                  We use bank-level encryption and direct connections to your financial institution.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This verification link will expire in 7 days. If you have any questions, please contact ${safeRequestedByEmail || safeRequestedByName}.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you did not expect this request, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">Powered by IncomeChecker.com</p>
              <p style="margin: 5px 0 0 0;">This email was sent to ${safeTo}</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send completion notification email to requester
 */
export async function sendCompletionEmail(params: SendCompletionEmailParams) {
  const { to, individualName, requestedByName, verificationLink } = params;

  // Escape all user-provided input for HTML
  const safeIndividualName = escapeHtml(individualName);
  const safeRequestedByName = escapeHtml(requestedByName);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Income verification completed for ${individualName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Verification Complete</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-top: 0;">Hello ${safeRequestedByName},</p>
              
              <p style="font-size: 16px;">
                Great news! <strong>${safeIndividualName}</strong> has completed their income verification.
              </p>
              
              <p style="font-size: 16px;">
                You can now view the complete income verification report, including:
              </p>
              
              <ul style="font-size: 16px; padding-left: 20px;">
                <li>12-month transaction history</li>
                <li>Monthly income estimates</li>
                <li>Account balances</li>
                <li>Recurring deposit patterns</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Report
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">Powered by IncomeChecker.com</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send completion email:', error);
    throw error;
  }
}

/**
 * Send reminder email to applicant
 */
export async function sendReminderEmail(params: SendReminderEmailParams) {
  const { to, individualName, requestedByName, verificationLink, daysRemaining } = params;

  // Escape all user-provided input for HTML
  const safeIndividualName = escapeHtml(individualName);
  const safeRequestedByName = escapeHtml(requestedByName);
  const safeTo = escapeHtml(to);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Reminder: Complete your income verification (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Reminder: Verification Pending</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-top: 0;">Hello ${safeIndividualName},</p>
              
              <p style="font-size: 16px;">
                This is a friendly reminder that <strong>${safeRequestedByName}</strong> is still waiting for you to complete your income verification.
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⏰ Time remaining:</strong> ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} until this link expires
                </p>
              </div>
              
              <p style="font-size: 16px;">
                Please complete your verification by securely connecting your bank account. This process takes just a few minutes.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Complete Verification Now
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you have any questions or concerns, please contact ${safeRequestedByName}.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">Powered by IncomeChecker.com</p>
              <p style="margin: 5px 0 0 0;">This email was sent to ${safeTo}</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw error;
  }
}
