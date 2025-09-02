'use client'

import React, { useState } from 'react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'
import { Button } from './button'
import { AlertCircle, CheckCircle, Loader2, CreditCard } from 'lucide-react'

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
      <Button disabled className="w-full bg-gray-600 text-white">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Initializing PayPal...
      </Button>
    )
  }

  if (isPending) {
    return (
      <Button disabled className="w-full bg-gray-600 text-white">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading PayPal...
      </Button>
    )
  }

  if (isRejected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-400 text-sm">PayPal failed to load. Please refresh the page.</span>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          Refresh Page
        </Button>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <span className="text-green-400 text-sm">Payment successful!</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-400 text-sm">{errorMessage}</span>
        </div>
        <Button 
          onClick={() => setStatus('idle')} 
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={handlePayPalError}
        onCancel={onCancel}
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay'
        }}
        disabled={isProcessing || status === 'creating'}
      />
      
      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          <span className="text-blue-400 text-sm">
            {status === 'approving' ? 'Approving payment...' : 
             status === 'capturing' ? 'Processing payment...' : 'Processing...'}
          </span>
        </div>
      )}
    </div>
  )
}
