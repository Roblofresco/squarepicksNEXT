'use client'

import React, { useState } from 'react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'
import { Button } from './button'
import { AlertCircle, CheckCircle, Loader2, CreditCard, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription } from './alert'

interface PayPalDepositButtonProps {
  amount: number
  onSuccess: (amount: number) => void
  onError: (error: string) => void
}

export function PayPalDepositButton({ amount, onSuccess, onError }: PayPalDepositButtonProps) {
  const [{ isPending, isInitial, isRejected }] = usePayPalScriptReducer()
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'creating' | 'approving' | 'capturing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const createOrder = async () => {
    if (status === 'creating') return null
    
    setStatus('creating')
    setErrorMessage('')
    
    try {
      const functions = getFunctions(app, 'us-east1')
      const createPayPalOrderCallable = httpsCallable(functions, 'createPayPalOrder')
      
      const result = await createPayPalOrderCallable({ 
        amount: amount.toFixed(2), 
        currency: 'USD', 
        intent: 'CAPTURE' 
      })
      
      const order = result.data as any
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
      return null
    }
  }

  const onApprove = async (data: { orderID: string }) => {
    setStatus('approving')
    setIsProcessing(true)
    
    try {
      // Call the capture API route
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ orderID: data.orderID })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to capture payment')
      }

      const result = await response.json()
      
      if (result.success) {
        setStatus('success')
        onSuccess(amount)
      } else {
        throw new Error(result.message || 'Payment capture failed')
      }
    } catch (err: any) {
      console.error("Error capturing PayPal order:", err)
      setStatus('error')
      setErrorMessage(err.message || "Failed to capture payment")
      onError(err.message || "Failed to capture payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (err: any) => {
    console.error("PayPal error:", err)
    setStatus('error')
    setErrorMessage("PayPal payment failed. Please try again.")
    onError("PayPal payment failed. Please try again.")
  }

  const onCancel = () => {
    setStatus('idle')
    setErrorMessage('')
  }

  // Helper function to get Firebase auth token
  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    return await user.getIdToken()
  }

  // Handle PayPal script loading states
  if (isInitial) {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-blue-400 font-medium">Initializing PayPal...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isPending) {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-blue-400 font-medium">Loading PayPal...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isRejected) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              PayPal failed to load. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            variant="destructive"
            className="w-full"
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    )
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
          <Shield className="h-5 w-5 text-blue-400" />
          <span>Secure Payment</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Powered by PayPal • Protected by SSL encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4">
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
            disabled={isProcessing || status === 'creating'}
          />
        </div>
        
        {isProcessing && (
          <Alert className="border-blue-500/20 bg-blue-500/5">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <AlertDescription className="text-blue-400">
              {status === 'approving' ? 'Approving payment...' : 
               status === 'capturing' ? 'Processing payment...' : 'Processing...'}
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
