'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { cn } from "@/lib/utils";
import { getAuth } from "firebase/auth"; // Import Firebase auth
import { getFunctions, httpsCallable } from 'firebase/functions'; // Added for httpsCallable
import { getApp } from 'firebase/app'; // Import getApp

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 1000;

export default function DepositPage() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading, userId } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!walletLoading) {
      if (!userId) {
        router.push('/login?redirect=/deposit');
      } else if (!hasWallet) {
        console.warn("Deposit attempt without completed wallet setup.");
        router.push('/wallet');
      }
    }
  }, [userId, hasWallet, walletLoading, router]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d.]/g, '');
    const decimalParts = value.split('.');
    if (decimalParts.length > 2) {
      value = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
    }
    if (decimalParts[1] && decimalParts[1].length > 2) {
      value = `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`;
    }
    setAmount(value);
    setError(null);
  };

  const createPayPalOrder = async (data: any, actions: any): Promise<string> => {
    console.log("Attempting to create PayPal order for deposit...");
    setError(null);
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
        setError("Invalid deposit amount for PayPal.");
        throw new Error("Invalid amount");
    }
    if (depositAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit is $${MIN_DEPOSIT}.`);
      throw new Error(`Minimum deposit is $${MIN_DEPOSIT}.`);
    }
    if (depositAmount > MAX_DEPOSIT) {
      setError(`Maximum deposit is $${MAX_DEPOSIT}.`);
      throw new Error(`Maximum deposit is $${MAX_DEPOSIT}.`);
    }
    

    setIsSubmitting(true);
    
    // Call backend API to create order with CAPTURE intent
    try {
      // Note: Backend needs to create order with intent: 'CAPTURE'
      const response = await fetch('/api/paypal/create-order', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: depositAmount.toFixed(2), currency: 'USD', intent: 'CAPTURE' })
      });
      const order = await response.json();
      if (!response.ok || !order.id) throw new Error(order.error || "Failed to create order");
      console.log("Created PayPal Order ID for Capture:", order.id);
      return order.id;
    } catch (err: any) {
      console.error("Error creating PayPal order:", err);
      setError(err.message || "Failed to initiate PayPal transaction.");
      setIsSubmitting(false); 
      throw new Error("Order creation failed"); 
    }
  };

  const onPayPalApprove = async (data: any, actions: any): Promise<void> => {
    console.log("PayPal Approved for Capture! Data:", data);
    setError(null);
    // Keep isSubmitting true while backend processes
    try {
      const auth = getAuth(); // Get auth instance
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated. Cannot capture order.");
      }

      // const idToken = await user.getIdToken(); // No longer needed for httpsCallable
      
      const app = getApp(); // Get the default Firebase app instance
      const functions = getFunctions(app, 'us-east1'); // Get functions instance for us-east1
      const capturePayPalOrderCallable = httpsCallable(functions, 'capturePayPalOrder'); // Specify function name

      const result = await capturePayPalOrderCallable({ orderID: data.orderID }); // Call the function

      // httpsCallable wraps the response in a 'data' object.
      // Assuming your cloud function returns the actual result directly (not nested further under another 'data' property)
      const captureResult = result.data as any; // Cast to 'any' or a more specific type if known

      // Check for backend errors based on your function's response structure
      // This part might need adjustment based on how your callable function signals success/error
      if (captureResult.error) { // Example: if your function returns { error: 'some error' }
         console.error("Capture Error Response:", captureResult);
         throw new Error(captureResult.error || captureResult.message || "Failed to capture order");
      }

      console.log("Capture successful:", captureResult);
      console.log("Deposit via PayPal successful. User profile updated by backend.");
      setSuccess(true);
      setTimeout(() => router.push('/wallet'), 2000);
      return;
    } catch (err: any) {
        console.error("Error capturing PayPal order:", err);
        // Display the specific error message if available
        let errorMessage = "Failed to finalize PayPal deposit.";
        if (err.message) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        // Check for Firebase Functions specific error codes or details
        if (err.code && err.details) {
          console.error(`Firebase Functions Error Code: ${err.code}, Details: ${err.details}`);
          // Potentially refine errorMessage based on err.code
        }
        setError(errorMessage);
        // Ensure loading state is turned off on error
        setIsSubmitting(false); 
    }
    // Do not set isSubmitting false here if successful, as we redirect
  };

  const onPayPalError = (err: any) => {
    console.error("PayPal Button Error:", err);
    setError("An error occurred with the PayPal transaction.");
    setIsSubmitting(false); 
  };

  const handleBack = () => {
    router.push('/wallet');
  };

  if (walletLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent-1 mb-4" />
        <p className="text-gray-300">Loading wallet status...</p>
      </div>
    );
  }
  
  if (!PAYPAL_CLIENT_ID) {
     console.error("PayPal Client ID missing");
     // Show a less disruptive error, or disable PayPal option
     // For now, just log and continue, PayPal button will fail later if selected
     return (
         <div className="min-h-screen bg-background-primary text-white flex flex-col items-center justify-center p-4">
             <div className="text-red-500">PayPal configuration error. Please contact support.</div>
         </div>
     )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary text-white p-4">
        <div className="bg-green-600 text-white rounded-lg px-6 py-4 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Deposit Successful!</h2>
          <p>Your funds have been added. Redirecting to your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}> 
      <div className="min-h-screen bg-background-primary text-white flex flex-col items-center p-4 pt-10">
        <div className="w-full max-w-lg"> 
          <div className="relative mb-8 text-center">
             <button 
              onClick={handleBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95 focus:scale-105 transition-all duration-150 outline-none"
              aria-label="Go back to wallet"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white">Deposit Funds</h1>
          </div>

          {/* Step 2 - Card with Light Background */}
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 animate-fadeIn">
               {/* Heading with Dark Text */}
               <h2 className="text-xl font-semibold text-gray-900 mb-5 text-center">
                 Enter Deposit Amount
               </h2>
               
              {/* Amount Input */}
              <div className="mb-6">
                 {/* Label with Dark Text */}
                 <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                   Amount (USD) <span className="text-xs text-gray-500">(Min ${MIN_DEPOSIT}, Max ${MAX_DEPOSIT})</span>
                 </Label>
                 <div className="relative mt-1 rounded-md shadow-sm">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                     {/* Darker $ Sign */}
                     <span className="text-gray-500 sm:text-sm">$</span>
                   </div>
                   <Input
                     id="amount"
                     name="amount"
                     type="text" 
                     inputMode="decimal" 
                     placeholder="0.00"
                     value={amount}
                     onChange={handleAmountChange}
                     required
                     // Input styles for light background
                     className="block w-full rounded-md border-gray-300 bg-white text-gray-900 placeholder-gray-500 pl-7 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-lg"
                     disabled={isSubmitting}
                   />
                 </div>
              </div>

               {/* Error Text with Darker Red */}
               {error && (
                 <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
               )}

              {/* Action: Show PayPal Buttons directly */}
              <div className="min-h-[50px] bg-transparent"> {/* Keep wrapper transparent */}
                   <PayPalButtons
                     key={`paypal-deposit-${amount}`}
                     style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
                     createOrder={createPayPalOrder} 
                     onApprove={onPayPalApprove}
                     onError={onPayPalError}
                     disabled={isSubmitting || !amount || parseFloat(amount) <= 0} 
                     onInit={(data, actions) => {
                         console.log("PayPal Buttons Initialized. Disabled state:", 
                           isSubmitting || !amount || parseFloat(amount) <= 0, 
                           { isSubmitting, amount: amount, parsedAmount: parseFloat(amount) }
                         );
                     }}
                     onClick={() => {
                         console.log("PayPal Button Clicked. State:", 
                           { isSubmitting, amount: amount, parsedAmount: parseFloat(amount) }
                         );
                     }}
                   />
                   {/* Clarification Text with Darker Grey */}
                    <p className="text-xs text-gray-500 text-center mt-3">
                        You can pay with PayPal or Debit/Credit Card.
                    </p>
               </div>
            </div>
          
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 