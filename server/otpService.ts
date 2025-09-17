import { User } from './mongoStorage';
import emailService from './emailService';
import twilioService from './twilioService';

class OTPService {
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendEmailOTP(userId: string, email: string, name: string): Promise<boolean> {
    try {
      const otp = this.generateOTP();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Update user with email OTP
      await User.findOneAndUpdate(
        { id: userId },
        {
          emailOTP: otp,
          otpExpiry: expiry,
        }
      );

      // Try to send email, but don't fail if it doesn't work (for testing)
      const emailSent = await emailService.sendOTP(email, otp, name);
      
      if (emailSent) {
        console.log(`✅ Email OTP sent to ${email}: ${otp}`);
        return true;
      } else {
        console.log(`⚠️ Email sending failed, but OTP saved for testing: ${otp}`);
        console.log(`📧 Use this OTP for email verification: ${otp}`);
        return true; // Return true for testing purposes
      }
    } catch (error) {
      console.error('Email OTP service error:', error);
      return false;
    }
  }

  async sendPhoneOTP(userId: string, phone: string, name: string): Promise<string | false> {
    try {
      // For testing: generate OTP and log it instead of sending SMS
      const otp = this.generateOTP();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await User.findOneAndUpdate(
        { id: userId },
        {
          phoneOTP: otp,
          otpExpiry: expiry,
        }
      );

      console.log(`📱 Use this OTP for phone verification: ${otp}`);
      return otp;

      /*
      // Start Twilio Verify challenge (no OTP storage needed)
      const sent = await twilioService.sendOTP(phone, name);
      
      if (sent) {
        // Optionally record an expiry window for UX/rate limiting (not required for Verify)
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await User.findOneAndUpdate(
          { id: userId },
          {
            otpExpiry: expiry,
            // clear any previous OTP remnants
            phoneOTP: null,
          }
        );

        console.log(`✅ SMS verification started for ${phone}`);
        return true;
      } else {
        console.log('⚠️ Failed to start SMS verification with Twilio');
        return false;
      }
      */
    } catch (error) {
      console.error('SMS OTP service error:', error);
      return false;
    }
  }

  async verifyEmailOTP(userId: string, otp: string): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (!user) {
        console.error('User not found for email OTP verification');
        return false;
      }

      // Check if OTP matches and hasn't expired
      if (user.emailOTP === otp && user.otpExpiry && user.otpExpiry > new Date()) {
        // Mark email as verified
        await User.findOneAndUpdate(
          { id: userId },
          {
            emailVerified: true,
            emailOTP: null,
            otpExpiry: null,
          }
        );

        // Check if both email and phone are verified
        await this.updateVerificationStatus(userId);
        
        console.log(`Email verified for user ${userId}`);
        return true;
      } else {
        console.error('Invalid or expired email OTP');
        return false;
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return false;
    }
  }

  async verifyPhoneOTP(userId: string, otp: string): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (!user) {
        console.error('User not found for phone OTP verification');
        return false;
      }

      // For testing: check OTP from DB
      if (user.phoneOTP === otp && user.otpExpiry && user.otpExpiry > new Date()) {
        await User.findOneAndUpdate(
          { id: userId },
          {
            phoneVerified: true,
            phoneOTP: null,
            otpExpiry: null,
          }
        );

        await this.updateVerificationStatus(userId);
        
        console.log(`Phone verified for user ${userId}`);
        return true;
      } else {
        console.error('Invalid or expired phone OTP');
        return false;
      }

      /*
      // Ask Twilio Verify to check the code
      const approved = await twilioService.verifyOTP(user.phone, otp);

      if (approved) {
        // Mark phone as verified
        await User.findOneAndUpdate(
          { id: userId },
          {
            phoneVerified: true,
            phoneOTP: null,
            otpExpiry: null,
          }
        );

        // Check if both email and phone are verified
        await this.updateVerificationStatus(userId);
        
        console.log(`Phone verified via Twilio Verify for user ${userId}`);
        return true;
      } else {
        console.error('Twilio Verify rejected the code');
        return false;
      }
      */
    } catch (error) {
      console.error('Error verifying phone OTP with Twilio Verify:', error);
      return false;
    }
  }

  private async updateVerificationStatus(userId: string): Promise<void> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (user && user.emailVerified && user.phoneVerified) {
        await User.findOneAndUpdate(
          { id: userId },
          { isVerified: true }
        );
        console.log(`User ${userId} is now fully verified`);
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  }

  async resendEmailOTP(userId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (!user) {
        console.error('User not found for email OTP resend');
        return false;
      }

      return await this.sendEmailOTP(userId, user.email, user.name);
    } catch (error) {
      console.error('Error resending email OTP:', error);
      return false;
    }
  }

  async resendPhoneOTP(userId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ id: userId });
      
      if (!user || !user.phone) {
        console.error('User not found or no phone number for OTP resend');
        return false;
      }

      const result = await this.sendPhoneOTP(userId, user.phone, user.name);
      return !!result;
    } catch (error) {
      console.error('Error resending phone OTP:', error);
      return false;
    }
  }
}

export default new OTPService();
