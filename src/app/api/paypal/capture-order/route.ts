import { NextResponse } from 'next/server';

// IMPORTANT: Replace this with your actual Cloud Function URL
// - Deployed: Find it in the Google Cloud Console or Firebase Console
// - Emulator: Usually http://localhost:5001/<your-project-id>/<region>/capturePayPalOrder
const CLOUD_FUNCTION_URL = process.env.CAPTURE_PAYPAL_ORDER_FUNCTION_URL || 'YOUR_CAPTURE_PAYPAL_ORDER_FUNCTION_URL';

export async function POST(request: Request) {
  console.log("API Route: /api/paypal/capture-order called (Proxying to Cloud Function)");

  let idToken: string | null = null;
  let orderID: string | null = null;

  try {
    // Extract Order ID from the original request body
    const body = await request.json();
    orderID = body.orderID;
    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID in request body.' }, { status: 400 });
    }

    // Extract Firebase ID Token from the original request header
    idToken = request.headers.get('Authorization'); // Get the full header value
    if (!idToken || !idToken.startsWith('Bearer ')) {
        console.error("Authorization header missing or invalid.");
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }

    console.log(`Proxying capture request for Order ID: ${orderID} to Cloud Function...`);

    // Call the Cloud Function
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken, // Forward the original Authorization header
      },
      body: JSON.stringify({ orderID }), // Send only the orderID in the body
    });

    // Relay the response (status and body) from the Cloud Function
    const responseData = await response.json();
    console.log(`Cloud Function response status: ${response.status}`);

    // Return the exact response received from the Cloud Function
    return NextResponse.json(responseData, { status: response.status });

  } catch (error: any) {
    console.error("Error proxying request to Cloud Function:", error);
    // Handle potential fetch errors or JSON parsing errors
    const message = error.message || 'Failed to process request via Cloud Function.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}