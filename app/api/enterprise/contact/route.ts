import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sanitizeEmail, escapeHtml } from '@/utils/sanitize';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'Income Verifier <noreply@yourdomain.com>';
const ENTERPRISE_EMAIL = process.env.ENTERPRISE_EMAIL || process.env.FROM_EMAIL || 'enterprise@yourdomain.com';
const CALENDLY_LINK = process.env.CALENDLY_LINK || 'https://calendly.com/your-calendly-link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: raw_email } = body;
    
    if (!raw_email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Sanitize email
    const email = sanitizeEmail(raw_email);
    
    // Validate email format after sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Escape email for HTML
    const safeEmail = escapeHtml(email);
    
    // Send email to enterprise team
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [ENTERPRISE_EMAIL],
        replyTo: email,
        subject: 'New Enterprise Inquiry',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Enterprise Inquiry</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; margin-top: 0;">A new enterprise inquiry has been submitted.</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #065f46;">
                    <strong>Contact Email:</strong> ${safeEmail}
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                  Please follow up with this potential enterprise customer to discuss their needs and provide a custom pricing quote.
                </p>
              </div>
            </body>
          </html>
        `,
      });
      
      if (error) {
        console.error('Resend error:', error);
        throw error;
      }
      
      // Also send confirmation to the requester
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Thank you for your interest in Income Verifier Enterprise',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Thank You!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; margin-top: 0;">Hello,</p>
                
                <p style="font-size: 16px;">
                  Thank you for your interest in Income Verifier Enterprise. Our team has received your inquiry and will reach out to you shortly to discuss your needs and provide a custom pricing quote.
                </p>
                
                <p style="font-size: 16px;">
                  In the meantime, feel free to schedule a demo call with us:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${CALENDLY_LINK}" 
                     target="_blank"
                     style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Schedule a Demo
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  We look forward to helping you streamline your income verification process!
                </p>
              </div>
            </body>
          </html>
        `,
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Inquiry submitted successfully'
      });
    } catch (emailError: any) {
      console.error('Failed to send enterprise email:', emailError);
      return NextResponse.json(
        { error: 'Failed to submit inquiry', details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in enterprise contact:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
