import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '', // App password for Gmail
      },
    };

    console.log('Email config:', {
      host: config.host,
      port: config.port,
      user: config.auth.user,
      passLength: config.auth.pass.length
    });

    this.transporter = nodemailer.createTransport(config);
    
    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('Email service ready to send messages');
      }
    });
  }

  async sendOTP(email: string, otp: string, name: string = 'User'): Promise<boolean> {
    try {
      console.log(`Attempting to send email OTP to: ${email}`);
      console.log(`Using email config - User: ${process.env.EMAIL_USER}, Host: ${process.env.EMAIL_HOST}`);
      
      const mailOptions = {
        from: `"SmartQ" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'SmartQ - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #e91e63; margin: 0; font-size: 28px;">SmartQ</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Smart Queue Management</p>
              </div>
              
              <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                Hi ${name},<br><br>
                Thank you for registering with SmartQ! To complete your account setup, please verify your email address using the code below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #e91e63; letter-spacing: 5px;">${otp}</span>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                This verification code will expire in <strong>5 minutes</strong>. If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  This is an automated message from SmartQ. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
