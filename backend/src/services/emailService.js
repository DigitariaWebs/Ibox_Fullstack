import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Gmail SMTP configuration
    const gmailUser = process.env.GMAIL_USER || 'achrefarabi414@gmail.com';
    const gmailPassword = process.env.GMAIL_APP_PASSWORD || 'lnjf qtql yiof bkjn';

    if (!gmailUser || !gmailPassword) {
      console.warn('⚠️  Gmail credentials not found. Email sending will fail.');
    }

    // Create SMTP transporter using Gmail SMTP settings
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    this.fromEmail = gmailUser;
    this.fromName = process.env.FROM_NAME || 'iBox App';

    console.log('📧 EmailService initialized with Gmail SMTP:', {
      host: 'smtp.gmail.com',
      port: 465,
      fromEmail: this.fromEmail,
      fromName: this.fromName
    });
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  async sendOTPEmail(email, otp, firstName = '', options = {}) {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Your iBox Verification Code',
        html: this.generateOTPEmailHTML(otp, firstName),
        text: this.generateOTPEmailText(otp, firstName)
      };

      console.log('📧 Sending OTP email via Gmail SMTP:', {
        to: email,
        from: this.fromEmail
      });

      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ OTP email sent successfully:', {
        messageId: result.messageId,
        to: email,
        accepted: result.accepted
      });

      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        message: 'OTP email sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send OTP email:', {
        error: error.message,
        code: error.code,
        to: email
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        message: 'Failed to send OTP email'
      };
    }
  }

  /**
   * Send welcome email after successful registration
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} - Result object
   */
  async sendWelcomeEmail(email, firstName = '') {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to iBox! 🚀',
        html: this.generateWelcomeEmailHTML(firstName),
        text: this.generateWelcomeEmailText(firstName)
      };

      console.log('📧 Sending welcome email via SMTP:', { to: email });

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Welcome email sent successfully:', {
        messageId: result.messageId,
        to: email
      });

      return {
        success: true,
        messageId: result.messageId,
        message: 'Welcome email sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send welcome email'
      };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} - Result object
   */
  async sendPasswordResetEmail(email, resetToken, firstName = '') {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Reset Your iBox Password',
        html: this.generatePasswordResetEmailHTML(resetUrl, firstName),
        text: this.generatePasswordResetEmailText(resetUrl, firstName)
      };

      console.log('📧 Sending password reset email via SMTP:', { to: email });

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Password reset email sent successfully:', {
        messageId: result.messageId,
        to: email
      });

      return {
        success: true,
        messageId: result.messageId,
        message: 'Password reset email sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send password reset email'
      };
    }
  }

  /**
   * Send driver approval notification email
   * @param {string} email - Driver email
   * @param {string} firstName - Driver's first name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  async sendDriverApprovalEmail(email, firstName = '', options = {}) {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: '🎉 Congratulations! Your iBox Driver Verification is Approved!',
        html: this.generateDriverApprovalEmailHTML(firstName),
        text: this.generateDriverApprovalEmailText(firstName)
      };

      console.log('📧 Sending driver approval email via Gmail SMTP:', {
        to: email,
        from: this.fromEmail
      });

      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Driver approval email sent successfully:', {
        messageId: result.messageId,
        to: email,
        accepted: result.accepted
      });

      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        message: 'Driver approval email sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send driver approval email:', {
        error: error.message,
        code: error.code,
        to: email
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        message: 'Failed to send driver approval email'
      };
    }
  }

  /**
   * Test SMTP connection
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      console.log('🔍 Testing SMTP connection...');
      
      // Verify SMTP connection
      await this.transporter.verify();
      
      console.log('✅ SMTP connection verified successfully');
      
      return {
        success: true,
        message: 'Gmail SMTP connection is working',
        host: 'smtp.gmail.com',
        port: 465
      };

    } catch (error) {
      console.error('❌ SMTP connection test failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'SMTP connection test failed'
      };
    }
  }

  /**
   * Generate HTML template for OTP email
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @returns {string} - HTML email template
   */
  generateOTPEmailHTML(otp, firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your iBox Verification Code</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc; 
                line-height: 1.6;
            }
            .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: #ffffff; 
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #0AA5A8 0%, #4DC5C8 25%, #7B68EE 75%, #9370DB 100%); 
                padding: 50px 20px; 
                text-align: center; 
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            }
            .logo { 
                color: white; 
                font-size: 42px; 
                font-weight: 800; 
                margin: 0; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
            .content { 
                padding: 50px 30px; 
                text-align: center;
            }
            .greeting {
                font-size: 28px;
                color: #1a202c;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .description {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 40px;
                line-height: 1.7;
            }
            .otp-container { 
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border: 3px solid #e2e8f0;
                border-radius: 16px; 
                padding: 40px 20px; 
                margin: 40px 0;
                position: relative;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            .otp-container::before {
                content: '🔐';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 8px 12px;
                border-radius: 50%;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .otp-label {
                font-size: 14px;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .otp-number { 
                font-size: 48px; 
                font-weight: 800; 
                color: #0AA5A8; 
                letter-spacing: 12px; 
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                text-shadow: 0 2px 4px rgba(10, 165, 168, 0.2);
                margin: 0;
            }
            .expiry-warning {
                background: #fff5f5;
                border: 1px solid #fed7d7;
                border-radius: 8px;
                padding: 15px;
                margin: 30px 0;
                color: #c53030;
                font-weight: 600;
                font-size: 14px;
            }
            .security-note {
                background: #f0fff4;
                border: 1px solid #9ae6b4;
                border-radius: 8px;
                padding: 15px;
                margin: 30px 0;
                color: #2f855a;
                font-size: 14px;
            }
            .footer { 
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                padding: 30px 20px; 
                text-align: center; 
                color: #718096; 
                font-size: 14px;
                border-top: 1px solid #e2e8f0;
            }
            .footer-logo {
                font-size: 24px;
                font-weight: 800;
                color: #0AA5A8;
                margin-bottom: 10px;
            }
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 20px 0;
            }
            @media (max-width: 600px) {
                .container { margin: 10px; border-radius: 8px; }
                .header { padding: 30px 15px; }
                .content { padding: 30px 20px; }
                .logo { font-size: 32px; }
                .greeting { font-size: 24px; }
                .otp-number { font-size: 36px; letter-spacing: 8px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">iBox</h1>
            </div>
            <div class="content">
                <h2 class="greeting">${greeting}! 👋</h2>
                <p class="description">
                    Welcome to iBox! To complete your registration and secure your account, 
                    please use the verification code below:
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Verification Code</div>
                    <div class="otp-number">${otp}</div>
                </div>
                
                <div class="expiry-warning">
                    ⏰ <strong>This code will expire in 5 minutes</strong>
                </div>
                
                <div class="security-note">
                    🔒 <strong>Security Note:</strong> If you didn't request this code, please ignore this email. 
                    Never share this code with anyone.
                </div>
                
                <div class="divider"></div>
                
                <p style="color: #4a5568; font-size: 16px; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #0AA5A8;">The iBox Team</strong>
                </p>
            </div>
            <div class="footer">
                <div class="footer-logo">iBox</div>
                <p>© 2024 iBox. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text template for OTP email
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   * @returns {string} - Text email template
   */
  generateOTPEmailText(otp, firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';

    return `
${greeting}!

Thank you for signing up for iBox. To complete your registration, please use the verification code below:

${otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The iBox Team

---
© 2024 iBox. All rights reserved.
This is an automated message, please do not reply.
    `;
  }

  /**
   * Generate HTML template for welcome email
   * @param {string} firstName - User's first name
   * @returns {string} - HTML email template
   */
  generateWelcomeEmailHTML(firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to iBox!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #0AA5A8, #4DC5C8, #7B68EE, #9370DB); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
            .content { padding: 40px 20px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">iBox</h1>
            </div>
            <div class="content">
                <h2>Welcome to iBox! 🚀</h2>
                <p>${greeting}!</p>
                <p>Your account has been successfully created. You can now start using iBox to manage your transportation needs.</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The iBox Team</p>
            </div>
            <div class="footer">
                <p>© 2024 iBox. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text template for welcome email
   * @param {string} firstName - User's first name
   * @returns {string} - Text email template
   */
  generateWelcomeEmailText(firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';

    return `
Welcome to iBox! 🚀

${greeting}!

Your account has been successfully created. You can now start using iBox to manage your transportation needs.

If you have any questions, feel free to contact our support team.

Best regards,
The iBox Team

---
© 2024 iBox. All rights reserved.
    `;
  }

  /**
   * Generate HTML template for password reset email
   * @param {string} resetUrl - Password reset URL
   * @param {string} firstName - User's first name
   * @returns {string} - HTML email template
   */
  generatePasswordResetEmailHTML(resetUrl, firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your iBox Password</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #0AA5A8, #4DC5C8, #7B68EE, #9370DB); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
            .content { padding: 40px 20px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; background-color: #0AA5A8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">iBox</h1>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>${greeting}!</p>
                <p>We received a request to reset your iBox account password. Click the button below to reset your password:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                
                <p>Best regards,<br>The iBox Team</p>
            </div>
            <div class="footer">
                <p>© 2024 iBox. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text template for password reset email
   * @param {string} resetUrl - Password reset URL
   * @param {string} firstName - User's first name
   * @returns {string} - Text email template
   */
  generatePasswordResetEmailText(resetUrl, firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';
    
    return `
Reset Your Password

${greeting}!

We received a request to reset your iBox account password. Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The iBox Team

---
© 2024 iBox. All rights reserved.
This is an automated message, please do not reply.
    `;
  }

  /**
   * Generate HTML template for driver approval email
   * @param {string} firstName - Driver's first name
   * @returns {string} - HTML email template
   */
  generateDriverApprovalEmailHTML(firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎉 Your iBox Driver Verification is Approved!</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc; 
                line-height: 1.6;
            }
            .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: #ffffff; 
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #10B981 0%, #059669 25%, #047857 75%, #065F46 100%); 
                padding: 50px 20px; 
                text-align: center; 
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            }
            .logo { 
                color: white; 
                font-size: 42px; 
                font-weight: 800; 
                margin: 0; 
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
            .celebration-icon {
                font-size: 64px;
                margin-bottom: 20px;
                position: relative;
                z-index: 1;
            }
            .content { 
                padding: 50px 30px; 
                text-align: center;
            }
            .greeting {
                font-size: 28px;
                color: #1a202c;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .congratulations {
                font-size: 24px;
                color: #10B981;
                margin-bottom: 30px;
                font-weight: 700;
            }
            .description {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 40px;
                line-height: 1.7;
            }
            .approval-container { 
                background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
                border: 3px solid #10B981;
                border-radius: 16px; 
                padding: 40px 20px; 
                margin: 40px 0;
                position: relative;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
            }
            .approval-container::before {
                content: '✅';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 8px 12px;
                border-radius: 50%;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .approval-label {
                font-size: 14px;
                color: #059669;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .approval-text { 
                font-size: 32px; 
                font-weight: 800; 
                color: #10B981; 
                margin: 0;
                text-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
            }
            .next-steps {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 30px;
                margin: 40px 0;
                text-align: left;
            }
            .next-steps h3 {
                color: #2d3748;
                font-size: 20px;
                margin-bottom: 20px;
                text-align: center;
            }
            .step {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .step-icon {
                font-size: 20px;
                margin-right: 15px;
                width: 30px;
                text-align: center;
            }
            .step-text {
                color: #4a5568;
                font-size: 14px;
                flex: 1;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 30px 0;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            }
            .footer { 
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                padding: 30px 20px; 
                text-align: center; 
                color: #718096; 
                font-size: 14px;
                border-top: 1px solid #e2e8f0;
            }
            .footer-logo {
                font-size: 24px;
                font-weight: 800;
                color: #10B981;
                margin-bottom: 10px;
            }
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 20px 0;
            }
            @media (max-width: 600px) {
                .container { margin: 10px; border-radius: 8px; }
                .header { padding: 30px 15px; }
                .content { padding: 30px 20px; }
                .logo { font-size: 32px; }
                .greeting { font-size: 24px; }
                .congratulations { font-size: 20px; }
                .approval-text { font-size: 24px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="celebration-icon">🎉</div>
                <h1 class="logo">iBox</h1>
            </div>
            <div class="content">
                <h2 class="greeting">${greeting}! 👋</h2>
                <h3 class="congratulations">Congratulations! 🎊</h3>
                <p class="description">
                    We're thrilled to inform you that your driver verification has been <strong>APPROVED</strong>! 
                    You are now officially part of the iBox driver community and can start accepting delivery requests.
                </p>
                
                <div class="approval-container">
                    <div class="approval-label">Verification Status</div>
                    <div class="approval-text">APPROVED ✅</div>
                </div>
                
                <div class="next-steps">
                    <h3>🚀 What's Next?</h3>
                    <div class="step">
                        <div class="step-icon">📱</div>
                        <div class="step-text">Open your iBox driver app and go online</div>
                    </div>
                    <div class="step">
                        <div class="step-icon">🚗</div>
                        <div class="step-text">Start receiving delivery requests in your area</div>
                    </div>
                    <div class="step">
                        <div class="step-icon">💰</div>
                        <div class="step-text">Earn money with every successful delivery</div>
                    </div>
                    <div class="step">
                        <div class="step-icon">⭐</div>
                        <div class="step-text">Build your rating and reputation</div>
                    </div>
                </div>
                
                <a href="#" class="cta-button">Start Driving Now! 🚗</a>
                
                <div class="divider"></div>
                
                <p style="color: #4a5568; font-size: 16px; margin: 0;">
                    Welcome to the iBox family!<br>
                    <strong style="color: #10B981;">The iBox Team</strong>
                </p>
            </div>
            <div class="footer">
                <div class="footer-logo">iBox</div>
                <p>© 2024 iBox. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text template for driver approval email
   * @param {string} firstName - Driver's first name
   * @returns {string} - Text email template
   */
  generateDriverApprovalEmailText(firstName = '') {
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';

    return `
🎉 Congratulations! Your iBox Driver Verification is Approved!

${greeting}!

We're thrilled to inform you that your driver verification has been APPROVED! 
You are now officially part of the iBox driver community and can start accepting delivery requests.

🚀 What's Next?

📱 Open your iBox driver app and go online
🚗 Start receiving delivery requests in your area
💰 Earn money with every successful delivery
⭐ Build your rating and reputation

Welcome to the iBox family!

Best regards,
The iBox Team

---
© 2024 iBox. All rights reserved.
This is an automated message, please do not reply.
    `;
  }
}

export default new EmailService();