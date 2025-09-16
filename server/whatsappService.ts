interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}

class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;
  private verifyToken: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'smartq-verify-token';
    
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    console.log('WhatsApp config:', {
      hasAccessToken: !!this.accessToken,
      phoneNumberId: this.phoneNumberId,
      apiVersion: this.apiVersion,
      accessTokenLength: this.accessToken.length
    });
  }

  async sendOTP(phoneNumber: string, otp: string, name: string = 'User'): Promise<boolean> {
    try {
      console.log(`Attempting to send WhatsApp OTP to: ${phoneNumber}`);
      console.log(`WhatsApp config check - Token length: ${this.accessToken.length}, Phone ID: ${this.phoneNumberId}`);
      
      // Ensure phone number is in international format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`Formatted phone number: ${formattedPhone}`);
      
      // For now, we'll use a simple text message since templates need approval
      const textMessageData = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: `🔐 SmartQ Verification\n\nHi ${name}!\n\nYour verification code is: *${otp}*\n\nThis code will expire in 5 minutes.\n\n⚠️ Do not share this code with anyone.`
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textMessageData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('WhatsApp message sent successfully:', data);
        return true;
      } else {
        const errorData = await response.json();
        console.error('WhatsApp API error:', response.status, errorData);
        console.error('Full error response:', JSON.stringify(errorData, null, 2));
        return false;
      }
    } catch (error: unknown) {
      console.error('WhatsApp sending failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
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
    
    // If it doesn't start with country code, add India code
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'smartq_webhook_token';
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified successfully');
      return challenge;
    }
    
    console.log('WhatsApp webhook verification failed');
    return null;
  }

  async handleWebhook(body: any): Promise<void> {
    try {
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));
      
      // Handle incoming messages, delivery receipts, etc.
      if (body.entry && body.entry[0] && body.entry[0].changes) {
        const changes = body.entry[0].changes[0];
        if (changes.field === 'messages') {
          const messages = changes.value.messages;
          if (messages && messages.length > 0) {
            // Process incoming messages if needed
            console.log('Received WhatsApp messages:', messages);
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error handling WhatsApp webhook:', error);
    }
  }
}

export default new WhatsAppService();
