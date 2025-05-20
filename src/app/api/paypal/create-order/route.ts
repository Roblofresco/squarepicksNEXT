import { NextResponse } from 'next/server';
import { createPayPalOrderAPI } from '@/lib/paypal-api'; // Import the actual API helper

// TODO: Import necessary PayPal SDK or configure fetch for REST API calls
// import paypal from '@paypal/checkout-server-sdk'; // Example if using the older server SDK

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY; // IMPORTANT: Store securely, DO NOT prefix with NEXT_PUBLIC_

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
  console.error('MISSING PAYPAL CREDENTIALS IN ENVIRONMENT VARIABLES');
  // Consider throwing an error or handling this more gracefully depending on deployment
}

// Placeholder for PayPal environment setup (Sandbox or Production)
// const environment = process.env.NODE_ENV === 'production'
//   ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY)
//   : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY);
// const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: Request) {
  console.log("API Route: /api/paypal/create-order called - REAL");

  try {
    // Get data passed from the frontend (amount, intent)
    const body = await request.json();
    const amount = body?.amount;
    const intent = body?.intent?.toUpperCase() || 'CAPTURE'; // Default to CAPTURE if not provided

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
    }
    if (intent !== 'CAPTURE' && intent !== 'AUTHORIZE') {
        return NextResponse.json({ error: 'Invalid intent provided.' }, { status: 400 });
    }

    // Define the order request body for PayPal API
    const orderData = {
      intent: intent, 
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: parseFloat(amount).toFixed(2), // Use the amount from the request
          },
          // Optional: Add description, items, etc. if needed
          // description: `Deposit for SquarePicks Account`,
        },
      ],
      // Optional: Add application_context if needed (e.g., return/cancel URLs for redirect flows)
      // application_context: {
      //   return_url: 'YOUR_RETURN_URL',
      //   cancel_url: 'YOUR_CANCEL_URL'
      // }
    };

    console.log(`Calling PayPal API to create order with intent: ${intent}, amount: ${amount}`);
    
    // Call the helper function to create the order via the REAL PayPal API
    const createdOrder = await createPayPalOrderAPI(orderData);

    // Return only the REAL Order ID to the frontend
    if (!createdOrder?.id) {
        console.error("PayPal order ID not found in API response:", createdOrder);
        throw new Error('PayPal order ID not found in response from PayPal API.');
    }
    console.log("Successfully created REAL PayPal order, ID:", createdOrder.id);
    return NextResponse.json({ id: createdOrder.id });

  } catch (error: any) {
    console.error("API Error creating REAL PayPal order:", error);
    return NextResponse.json({ error: 'Failed to create PayPal order.', details: error.message }, { status: 500 });
  }
} 