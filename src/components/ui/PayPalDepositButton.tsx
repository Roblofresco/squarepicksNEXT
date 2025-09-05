'use client'

import React, { useState } from 'react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Button } from './button'
import { AlertCircle, CheckCircle, Loader2, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription } from './alert'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

interface PayPalDepositButtonProps {
  amount: number
  userId: string
  onSuccess: (amount: number) => void
  onError: (error: string) => void
}

export function PayPalDepositButton({ amount, userId, onSuccess, onError }: PayPalDepositButtonProps) {
  const [{ isPending, isInitial, isRejected }] = usePayPalScriptReducer()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'creating' | 'approving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const createOrder = async () => {
    try {
      setStatus('creating')
      setIsProcessing(true)
      
      // Following PayPal's official recommendation for server-side order creation
      // This ensures proper validation and security
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          currency: 'USD',
          intent: 'CAPTURE'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const order = await response.json()
      if (!order?.id) {
        throw new Error(order.error || "Failed to create order")
      }
      
      setStatus('idle')
      return order.id
    } catch (err: any) {
      console.error("Error creating PayPal order:", err)
      setStatus('error')
      setErrorMessage(err.message || "Failed to create PayPal order")
      onError(err.message || "Failed to create PayPal order")
      // Reject so the PayPal SDK halts and surfaces the error instead of proceeding without an order id
      throw err
    }
  }

  const onApprove = async (data: { orderID: string }) => {
    setStatus('approving')
    setIsProcessing(true)
    try {
      const functions = getFunctions(app, 'us-east1')
      const capturePayPalOrder = httpsCallable(functions, 'capturePayPalOrder')
      const callableResp: any = await capturePayPalOrder({ orderID: data.orderID })
      const result = callableResp?.data ?? callableResp
      if (result?.success) {
        setStatus('success')
        onSuccess(amount)
      } else {
        throw new Error(result?.message || 'Payment capture failed')
      }
    } catch (err: any) {
      console.error('Error capturing PayPal order:', err)
      setStatus('error')
      setErrorMessage(err?.message || 'Failed to capture payment')
      onError(err?.message || 'Failed to capture payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (err: any) => {
    console.error('PayPal error:', err)
    setStatus('error')
    setErrorMessage('Payment failed. Please try again.')
    onError('Payment failed')
  }

  const onCancel = () => {
    console.log('PayPal payment cancelled')
    setStatus('idle')
    setIsProcessing(false)
  }

  // Loading state
  if (isPending || isInitial) {
    return (
      <Card className="border-gray-200/20 bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading PayPal...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isRejected) {
    return (
      <Card className="border-red-200/20 bg-white shadow-lg">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="space-y-2">
                <p className="font-medium">PayPal is not available</p>
                <p className="text-sm">
                  PayPal integration is not properly configured. Please contact support or try again later.
                </p>
                <details className="text-xs text-red-600">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <p className="mt-1">
                    PayPal client ID is missing or invalid. Check environment configuration.
                  </p>
                </details>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200/20 bg-white shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg text-gray-800 flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span>Secure Payment</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Powered by PayPal • Protected by SSL encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={handlePayPalError}
            onCancel={onCancel}
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay',
              height: 45,
              tagline: false
            }}
            disabled={isProcessing || status === 'creating' || !userId}
          />
        </div>

        {isProcessing && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-700">
              {status === 'approving' ? 'Processing payment...' : 'Processing...'}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>PayPal Protected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}