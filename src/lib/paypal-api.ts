const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;

// Determine PayPal API base URL based on environment
const base = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Fetches a PayPal API access token using Client ID and Secret Key.
 * @returns {Promise<string>} The access token.
 * @throws {Error} If fetching the token fails.
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
    throw new Error('PayPal client ID or secret key is missing in environment variables.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64');

  try {
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (!data?.access_token) {
        throw new Error('Access token not found in PayPal response.');
    }
    
    console.log("Fetched PayPal Access Token (expires in", data.expires_in, "seconds)");
    return data.access_token;

  } catch (error) {
    console.error("Error getting PayPal access token:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Creates a PayPal order.
 * @param {object} orderData - The data for the order (e.g., amount, currency).
 * @returns {Promise<object>} The created order object from PayPal.
 * @throws {Error} If creating the order fails.
 */
export async function createPayPalOrderAPI(orderData: any): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  try {
    const response = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        // Uncomment if using a unique request ID is required by PayPal or for idempotency
        // 'PayPal-Request-Id': crypto.randomUUID(), 
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create PayPal order: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const createdOrder = await response.json();
    console.log("Successfully created PayPal order:", createdOrder.id);
    return createdOrder;

  } catch (error) {
    console.error("Error creating PayPal order via API:", error);
    throw error; // Re-throw the error
  }
}

// Add functions for capturing/authorizing orders as needed
/**
 * Captures or Authorizes a PayPal order.
 * @param {string} orderId - The ID of the order to capture/authorize.
 * @param {string} intent - 'CAPTURE' or 'AUTHORIZE'
 * @returns {Promise<object>} The result of the capture/authorize operation.
 * @throws {Error} If the operation fails.
 */
export async function captureOrAuthorizePayPalOrderAPI(orderId: string, intent: 'CAPTURE' | 'AUTHORIZE'): Promise<any> {
    const accessToken = await getPayPalAccessToken();
    const action = intent.toLowerCase(); // 'capture' or 'authorize'

    try {
        const response = await fetch(`${base}/v2/checkout/orders/${orderId}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            // No body needed for capture/authorize usually
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to ${action} PayPal order ${orderId}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const resultData = await response.json();
        console.log(`Successfully ${action}d PayPal order:`, orderId, resultData.status);
        return resultData;

    } catch (error) {
        console.error(`Error ${action}ing PayPal order via API:`, error);
        throw error; // Re-throw the error
    }
} 