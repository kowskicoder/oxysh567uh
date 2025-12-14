import crypto from 'crypto'

/**
 * Initialize a Paystack transaction
 */
export async function initializePaystackTransaction(
  email: string,
  amount: number, // in naira
  reference: string,
  secretKey: string
): Promise<{
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}> {
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        reference,
      }),
    })

    return (await response.json()) as {
      status: boolean
      message: string
      data?: {
        authorization_url: string
        access_code: string
        reference: string
      }
    }
  } catch (error) {
    console.error('Paystack initialization error:', error)
    return {
      status: false,
      message: 'Failed to initialize payment',
    }
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPaystackPayment(
  reference: string,
  secretKey: string
): Promise<{
  status: boolean
  message: string
  data?: {
    reference: string
    amount: number
    status: string
    customer: { email: string; customer_code: string }
  }
}> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      }
    )

    return (await response.json()) as {
      status: boolean
      message: string
      data?: {
        reference: string
        amount: number
        status: string
        customer: { email: string; customer_code: string }
      }
    }
  } catch (error) {
    console.error('Paystack verification error:', error)
    return {
      status: false,
      message: 'Failed to verify payment',
    }
  }
}

/**
 * Verify Paystack webhook signature
 */
export function verifyPaystackWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(payload)
      .digest('hex')
    return hash === signature
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Generate a unique transaction reference
 */
export function generatePaystackReference(telegramId: string): string {
  return `miniapp_${telegramId}_${Date.now()}`
}
