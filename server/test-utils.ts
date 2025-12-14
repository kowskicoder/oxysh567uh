
import { apiRequest } from "../client/src/lib/queryClient";

export class PaymentTestUtils {
  static readonly TEST_CARDS = {
    SUCCESS: "4084084084084081",
    INSUFFICIENT_FUNDS: "4084084084084085", 
    INVALID: "4084084084084089",
    DECLINED: "4084084084084087"
  };

  static async testDeposit(userId: string, amount: number) {
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer test_token_${userId}`
        },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      console.log('Deposit test result:', data);
      return data;
    } catch (error) {
      console.error('Deposit test failed:', error);
      throw error;
    }
  }

  static async testWithdraw(userId: string, amount: number) {
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer test_token_${userId}`
        },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      console.log('Withdrawal test result:', data);
      return data;
    } catch (error) {
      console.error('Withdrawal test failed:', error);
      throw error;
    }
  }

  static async testWebhook(eventData: any) {
    const crypto = require('crypto');
    const body = JSON.stringify(eventData);
    const signature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test_key')
      .update(body)
      .digest('hex');

    try {
      const response = await fetch('/api/webhook/paystack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Paystack-Signature': signature
        },
        body
      });
      
      const result = await response.json();
      console.log('Webhook test result:', result);
      return result;
    } catch (error) {
      console.error('Webhook test failed:', error);
      throw error;
    }
  }

  static generateTestWebhookEvent(userId: string, amount: number, reference?: string) {
    return {
      event: 'charge.success',
      data: {
        reference: reference || `test_${Date.now()}`,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        status: 'success',
        metadata: {
          userId,
          type: 'deposit'
        },
        customer: {
          email: 'test@example.com'
        }
      }
    };
  }

  static async runAllTests(userId: string) {
    console.log('🧪 Starting payment flow tests...');
    
    try {
      // Test 1: Successful deposit
      console.log('\n📥 Testing deposit flow...');
      await this.testDeposit(userId, 1000);
      
      // Test 2: Withdrawal
      console.log('\n📤 Testing withdrawal flow...');
      await this.testWithdraw(userId, 500);
      
      // Test 3: Webhook processing
      console.log('\n🔗 Testing webhook processing...');
      const webhookEvent = this.generateTestWebhookEvent(userId, 2000);
      await this.testWebhook(webhookEvent);
      
      // Test 4: Invalid amounts
      console.log('\n❌ Testing invalid amounts...');
      try {
        await this.testDeposit(userId, -100);
        console.log('ERROR: Negative deposit should have failed!');
      } catch (error) {
        console.log('✅ Negative deposit correctly rejected');
      }
      
      console.log('\n✅ All payment tests completed!');
      
    } catch (error) {
      console.error('❌ Payment tests failed:', error);
    }
  }
}

// Usage example:
// PaymentTestUtils.runAllTests('test_user_123');
