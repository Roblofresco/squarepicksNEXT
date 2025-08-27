'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { useWallet } from '@/hooks/useWallet';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { motion } from 'framer-motion';
import { HeroText } from '@/components/ui/hero-text';
import { WalletMoneyContainer } from '@/components/ui/WalletMoneyContainer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 1000;

const depositFormSchema = z.object({
  amount: z.string()
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Please enter a valid amount")
    .refine(val => {
      const num = parseFloat(val);
      return num >= MIN_DEPOSIT;
    }, `Minimum deposit is $${MIN_DEPOSIT}`)
    .refine(val => {
      const num = parseFloat(val);
      return num <= MAX_DEPOSIT;
    }, `Maximum deposit is $${MAX_DEPOSIT}`)
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

export default function DepositPage() {
  const router = useRouter();
  const { hasWallet, isLoading: walletLoading, userId } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState<string>('');

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: '',
    },
  });

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

  const createPayPalOrder = async (data: any, actions: any): Promise<string> => {
    console.log("Attempting to create PayPal order for deposit...");
    setError(null);
    const formAmount = form.getValues("amount");
    const depositAmount = parseFloat(formAmount);

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
    
    try {
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
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not authenticated. Cannot capture order.");
      }

      const app = getApp();
      const functions = getFunctions(app, 'us-east1');
      const capturePayPalOrderCallable = httpsCallable(functions, 'capturePayPalOrder');

      const result = await capturePayPalOrderCallable({ orderID: data.orderID });
      const captureResult = result.data as any;

      if (captureResult.error) {
         console.error("Capture Error Response:", captureResult);
         throw new Error(captureResult.error || captureResult.message || "Failed to capture order");
      }

      console.log("Capture successful:", captureResult);
      console.log("Deposit via PayPal successful. User profile updated by backend.");
      const formAmount = form.getValues("amount");
      setSuccessAmount(formAmount);
      setSuccess(true);
      return;
    } catch (err: any) {
        console.error("Error capturing PayPal order:", err);
        let errorMessage = "Failed to finalize PayPal deposit.";
        if (err.message) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }
        if (err.code && err.details) {
          console.error(`Firebase Functions Error Code: ${err.code}, Details: ${err.details}`);
        }
        setError(errorMessage);
        setIsSubmitting(false); 
    }
  };

  const onPayPalError = (err: any) => {
    console.error("PayPal Button Error:", err);
    setError("An error occurred with the PayPal transaction.");
    setIsSubmitting(false); 
  };

  if (walletLoading) {
     return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Breadcrumbs */}
          <div className="mb-3 pl-4 sm:pl-6 mt-3 sm:mt-4">
            <Skeleton className="h-6 w-48" />
          </div>

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <Skeleton className="h-10 w-48" />
          </div>

          {/* Content */}
          <div className="flex justify-center mt-8">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer
                variant="blue"
                className="animate-fadeIn"
              >
                <div className="flex flex-col">
                  <div className="space-y-6 px-4 sm:px-6">
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                  <div className="-mx-4 sm:-mx-6 bg-white/5 rounded-t-xl mt-6 flex-grow">
                    <Skeleton className="h-[100px] w-full rounded-t-xl" />
                  </div>
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!PAYPAL_CLIENT_ID) {
     console.error("PayPal Client ID missing");
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Breadcrumbs */}
          {(() => {
            const backHref = '/profile';
     return (
                              <Breadcrumbs 
                  className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3"
                  items={[
                    { label: 'Profile', href: '/profile' }
                  ]}
                  appendEllipsisHref="/profile"
                  ellipsisUseHistory={false}
              />
            );
          })()}

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <div className="relative">
              <HeroText id="deposit" className="text-3xl font-bold text-text-primary">
                <h1>Deposit Funds</h1>
              </HeroText>
            </div>
            <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal or credit/debit card.</p>
          </div>

          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer
                variant="blue"
                className="animate-fadeIn"
              >
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 mx-4 sm:mx-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    PayPal configuration error. Please try again later or contact support.
                  </AlertDescription>
                </Alert>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
         </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Breadcrumbs */}
          {(() => {
            const backHref = '/profile';
            return (
                              <Breadcrumbs 
                  className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3"
                  items={[
                    { label: 'Profile', href: '/profile' }
                  ]}
                  appendEllipsisHref="/profile"
                  ellipsisUseHistory={false}
              />
            );
          })()}

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <div className="relative">
              <HeroText id="deposit" className="text-3xl font-bold text-text-primary">
                <h1>Deposit Funds</h1>
              </HeroText>
            </div>
            <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal or credit/debit card.</p>
          </div>

          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer
                title={`$${successAmount} Deposit Successful!`}
                variant="blue"
                className="animate-fadeIn border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 px-4 sm:px-6">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <CheckCircle2 className="h-16 w-16 text-green-400" />
                    <p className="text-white/80">Your funds have been added to your wallet.</p>
                    <Link
                      href="/wallet"
                      className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-500/20 hover:bg-green-500/30 rounded-md transition-colors duration-200"
                    >
                      View Wallet
                    </Link>
                  </motion.div>
                </div>
              </WalletMoneyContainer>
            </div>
        </div>
        </motion.div>
      </div>
    );
  }

  // Create a wrapper component to handle PayPal script loading
  interface PayPalButtonsWrapperProps {
    form: ReturnType<typeof useForm<DepositFormValues>>;
    isSubmitting: boolean;
    createPayPalOrder: (data: any, actions: any) => Promise<string>;
    onPayPalApprove: (data: any, actions: any) => Promise<void>;
    onPayPalError: (err: any) => void;
  }

  function PayPalButtonsWrapper({ form, isSubmitting, createPayPalOrder, onPayPalApprove, onPayPalError }: PayPalButtonsWrapperProps) {
    const [{ isPending }] = usePayPalScriptReducer();

    if (isPending) {
      return (
        <div className="w-full h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent-1" />
        </div>
      );
    }

    return (
      <PayPalButtons
        forceReRender={[form.getValues("amount"), isSubmitting]}
        style={{ 
          layout: "vertical",
          shape: "rect",
          label: "paypal",
          height: 48,
          color: "blue"
        }}
        fundingSource="paypal"
        createOrder={createPayPalOrder} 
        onApprove={onPayPalApprove}
        onError={onPayPalError}
        onCancel={() => {
          console.log("PayPal payment cancelled");
          setError(null);
          setIsSubmitting(false);
        }}
                  onInit={(data, actions) => {
            const formAmount = form.getValues("amount");
            const amount = parseFloat(formAmount);
            const isDisabled = isSubmitting || !formAmount || isNaN(amount) || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT;
            
            console.log("PayPal button init:", { amount, MIN_DEPOSIT, isDisabled });
            
            if (isDisabled) {
              return actions.disable();
            } else {
              return actions.enable();
            }
        }}
      />
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        'enable-funding': "venmo,card",
        'disable-funding': "paylater",
        'data-sdk-integration-source': "button_js",
        'data-user-experience-flow': "smart-payment-buttons",
        'data-page-type': "checkout",
        'data-client-metadata-id': userId,
        'data-react-integration': "true"
      }}>
      <div className="min-h-screen bg-background-primary text-text-primary p-0 sm:p-0 lg:p-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
          {/* Breadcrumbs */}
          {(() => {
            const backHref = '/profile';
            return (
                              <Breadcrumbs 
                  className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3"
                  items={[
                    { label: 'Profile', href: '/profile' }
                  ]}
                  appendEllipsisHref="/profile"
                  ellipsisUseHistory={false}
              />
            );
          })()}

          {/* Title */}
          <div className="mb-4 pl-4 sm:pl-6">
            <div className="relative">
              <HeroText id="deposit" className="text-3xl font-bold text-text-primary">
                <h1>Deposit Funds</h1>
              </HeroText>
            </div>
            <p className="mt-3 text-sm text-gray-300">Add funds to your wallet using PayPal or credit/debit card.</p>
          </div>

          {/* Content */}
          <div className="flex justify-center mt-16">
            <div className="w-full max-w-lg">
              <WalletMoneyContainer
                title="Add Funds"
                variant="blue"
                className="animate-fadeIn"
              >
                                <div className="flex flex-col min-h-[30vh]">
                  <div className="px-4 sm:px-6 pb-4">
                    <Form {...form}>
                      <form>
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-white/90">
                                Amount (USD) <span className="text-xs text-white/50">(Min ${MIN_DEPOSIT}, Max ${MAX_DEPOSIT})</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative mt-1 rounded-md">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-white/70 sm:text-sm">$</span>
                   </div>
                   <Input
                     type="text" 
                     inputMode="decimal" 
                     placeholder="0.00"
                                    className="block w-full rounded-md bg-white/5 text-white placeholder-white/30 pl-7 pr-4 py-2 border-white/10 focus:border-accent-1 focus:ring-accent-1 sm:text-sm text-lg"
                     disabled={isSubmitting}
                                    {...field}
                   />
                 </div>
                              </FormControl>
                              <FormMessage className="text-sm text-red-400" />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>

               {error && (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="-mx-4 sm:-mx-6 bg-white rounded-t-xl mt-6 flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col">
                      {/* PayPal Button with loading state handling */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-4">
                          <PayPalButtonsWrapper
                            form={form}
                            isSubmitting={isSubmitting}
                            createPayPalOrder={createPayPalOrder}
                            onPayPalApprove={onPayPalApprove}
                            onPayPalError={onPayPalError}
                          />
                        </div>
                      </div>
                      <div className="border-t border-gray-200 p-3">
                        <p className="text-xs text-gray-500 text-center">
                        You can pay with PayPal or Debit/Credit Card.
                    </p>
               </div>
            </div>
                  </div>
                </div>
              </WalletMoneyContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </PayPalScriptProvider>
  );
} 