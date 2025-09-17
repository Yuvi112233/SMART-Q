import twilio, { Twilio } from 'twilio';
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
}

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private verifyServiceSid: string;
  private client: Twilio | null = null;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    // Initialize client if creds available
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }

    console.log('Twilio config:', {
      hasSid: !!this.accountSid,
      hasToken: !!this.authToken,
      hasVerifyService: !!this.verifyServiceSid,
      sidLength: this.accountSid.length,
    });
  }

  async sendOTP(phoneNumber: string, name: string = 'User'): Promise<boolean> {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);

      if (!this.client) {
        this.client = twilio(this.accountSid, this.authToken);
      }

      const res = await this.client.verify.v2.services(this.verifyServiceSid)
        .verifications
        .create({ to: formatted, channel: 'sms' });

      console.log('Twilio Verify started:', {
        sid: res.sid,
        status: res.status,
        to: res.to,
        channel: res.channel,
      });
      return true;
    } catch (error: any) {
      console.error('Twilio Verify send failed:', error?.message || error);
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      if (!this.client) {
        this.client = twilio(this.accountSid, this.authToken);
      }

      const check = await this.client.verify.v2.services(this.verifyServiceSid)
        .verificationChecks
        .create({ to: formatted, code });

      console.log('Twilio Verify check:', {
        sid: check.sid,
        status: check.status,
        to: check.to,
      });

      return check.status === 'approved';
    } catch (error: any) {
      console.error('Twilio Verify check failed:', error?.message || error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with 0, replace with country code (assuming India +91)
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }

    // If it doesn't start with country code, add India code for 10-digit numbers
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // Ensure it has + prefix for E.164
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}

export default new TwilioService();
