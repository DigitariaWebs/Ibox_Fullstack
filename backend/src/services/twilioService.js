import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    
    if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
      throw new Error('Missing required Twilio configuration. Please check your environment variables.');
    }
    
    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Send SMS verification code to phone number
   * @param {string} phoneNumber - Phone number in E.164 format (e.g., +213542799884)
   * @returns {Promise<Object>} Verification object
   */
  async sendVerificationCode(phoneNumber) {
    try {
      // Ensure phone number is in correct format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .create({
          to: formattedPhone,
          channel: 'sms'
        });

      return {
        success: true,
        sid: verification.sid,
        status: verification.status,
        to: verification.to,
        channel: verification.channel,
        dateCreated: verification.dateCreated
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      // Handle specific Twilio errors
      if (error.code === 20008) {
        throw new Error('Invalid phone number format. Please check the phone number and try again.');
      } else if (error.code === 60200) {
        throw new Error('Invalid phone number. Please enter a valid phone number.');
      } else if (error.code === 60202) {
        throw new Error('Phone number verification limit exceeded. Please try again later.');
      } else if (error.code === 60203) {
        throw new Error('Phone number is blocked. Please contact support.');
      }
      
      throw new Error('Failed to send verification code. Please try again.');
    }
  }

  /**
   * Verify the SMS code entered by user
   * @param {string} phoneNumber - Phone number in E.164 format
   * @param {string} code - 6-digit verification code
   * @returns {Promise<Object>} Verification check result
   */
  async verifyCode(phoneNumber, code) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks
        .create({
          to: formattedPhone,
          code: code
        });

      return {
        success: verificationCheck.status === 'approved',
        status: verificationCheck.status,
        to: verificationCheck.to,
        channel: verificationCheck.channel,
        dateCreated: verificationCheck.dateCreated,
        valid: verificationCheck.valid
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      
      // Handle specific Twilio errors
      if (error.code === 20404) {
        throw new Error('Invalid verification code or verification session expired.');
      } else if (error.code === 60202) {
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      } else if (error.code === 60200) {
        throw new Error('Invalid phone number format.');
      }
      
      throw new Error('Failed to verify code. Please try again.');
    }
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it needs country code
    if (!cleaned.startsWith('+')) {
      // This is a simplified approach - in production you might want
      // to handle different country codes based on user location
      throw new Error('Phone number must include country code (e.g., +213542799884)');
    }
    
    return cleaned;
  }

  /**
   * Get verification status
   * @param {string} phoneNumber - Phone number to check
   * @returns {Promise<Object>} Current verification status
   */
  async getVerificationStatus(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const verifications = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .list({
          to: formattedPhone,
          limit: 1
        });

      if (verifications.length === 0) {
        return {
          exists: false,
          status: null
        };
      }

      const verification = verifications[0];
      return {
        exists: true,
        status: verification.status,
        to: verification.to,
        channel: verification.channel,
        dateCreated: verification.dateCreated
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw new Error('Failed to check verification status.');
    }
  }

  /**
   * Cancel pending verification
   * @param {string} phoneNumber - Phone number to cancel verification for
   * @returns {Promise<boolean>} Success status
   */
  async cancelVerification(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Get the most recent verification
      const verifications = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .list({
          to: formattedPhone,
          limit: 1
        });

      if (verifications.length > 0 && verifications[0].status === 'pending') {
        await this.client.verify.v2
          .services(this.verifyServiceSid)
          .verifications(verifications[0].sid)
          .update({ status: 'canceled' });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error canceling verification:', error);
      throw new Error('Failed to cancel verification.');
    }
  }
}

// Export singleton instance
const twilioService = new TwilioService();
export default twilioService;
