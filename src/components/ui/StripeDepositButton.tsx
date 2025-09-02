'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from './button'
import { AlertCircle, CheckCircle, Loader2, CreditCard, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription } from './alert'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface StripeDepositButtonProps {
  amount: number
  onSuccess: (amount: number) => void
  onError: (error: string) => void
}

function StripePaymentForm({ amount, onSuccess, onError }: StripeDepositButtonProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setStatus('processing')
    setErrorMessage('')

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
        }),
      })

      const { client_secret } = await response.json()

      if (!client_secret) {
        throw new Error('Failed to create payment intent')
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        throw new Error(error.message || 'Payment failed')
      }

      if (paymentIntent.status === 'succeeded') {
        setStatus('success')
        onSuccess(amount)
      } else {
        throw new Error('Payment was not successful')
      }
    } catch (err: any) {
      console.error('Stripe payment error:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Payment failed. Please try again.')
      onError(err.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'success') {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">Payment successful!</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => setStatus('idle')} 
            variant="destructive"
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-600/20 bg-gray-800/30">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg text-white flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5 text-purple-400" />
          <span>Secure Payment</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Powered by Stripe • Protected by SSL encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Stripe Protected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StripeDepositButton({ amount, onSuccess, onError }: StripeDepositButtonProps) {
  // Check if Stripe is properly configured
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'pk_test_placeholder') {
    return (
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe is not configured. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
