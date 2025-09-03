import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  // Only initialize if all required environment variables are present
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    initializeApp({
      credential: cert(serviceAccount),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is properly initialized
    if (!getApps().length) {
      return NextResponse.json(
        { error: 'Firebase not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const db = getFirestore()

    const { userId, amount, orderId, currency = 'USD' } = await request.json()

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400 }
      )
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Valid order ID is required' },
        { status: 400 }
      )
    }

    const depositAmount = parseFloat(amount)

    // Use Firestore transaction for atomic operations
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId)
      const transactionRef = db.collection('transactions').doc()

      // Read current user data
      const userDoc = await transaction.get(userRef)
      
      if (!userDoc.exists) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      if (!userData) {
        throw new Error('User data not found')
      }

      // Check if user has wallet initialized
      if (userData.hasWallet !== true) {
        throw new Error('User wallet not initialized')
      }

      const currentBalance = userData.balance || 0
      const newBalance = currentBalance + depositAmount

      // Update user balance
      transaction.update(userRef, {
        balance: newBalance,
        updated_time: new Date(),
      })

      // Create transaction record
      const transactionData = {
        userID: userId,
        type: 'deposit',
        amount: depositAmount,
        currency: currency,
        description: `PayPal Deposit of $${depositAmount.toFixed(2)} - Order ID: ${orderId}`,
        orderId: orderId,
        newBalance: newBalance,
        previousBalance: currentBalance,
        timestamp: new Date(),
        status: 'completed',
      }

      transaction.set(transactionRef, transactionData)

      // Create notification
      const notificationRef = db.collection('notifications').doc()
      const notificationData = {
        userID: userId,
        title: 'Deposit Successful',
        message: `Your deposit of $${depositAmount.toFixed(2)} was successful.`,
        type: 'deposit_success',
        relatedID: transactionRef.id,
        isRead: false,
        timestamp: new Date(),
      }

      transaction.set(notificationRef, notificationData)

      return {
        success: true,
        newBalance,
        previousBalance: currentBalance,
        transactionId: transactionRef.id,
        notificationId: notificationRef.id,
      }
    })

    return NextResponse.json({
      message: 'Wallet balance updated successfully',
      ...result,
    })

  } catch (error: any) {
    console.error('Error updating wallet balance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update wallet balance' },
      { status: 500 }
    )
  }
}
