'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { 
  FaWallet, 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaHistory, 
  FaPlus, 
  FaMinus,
  FaChevronLeft,
  FaExchangeAlt,
  FaCheck,
  FaDownload,
  FaQuestionCircle
} from 'react-icons/fa'

// Mock transaction data
const getTransactionById = (id: string) => {
  const transactions = {
    'tx1': {
      id: 'tx1',
      type: 'deposit',
      description: 'Deposit via Visa',
      amount: 100.00,
      date: 'Mar 10, 2025',
      time: '2:34 PM',
      status: 'Completed',
      paymentMethod: 'Visa ending in 4242',
      reference: 'DEP-12345678',
      processingFee: 2.50,
      details: 'Funds added to your SquarePicks wallet',
    },
    'tx2': {
      id: 'tx2',
      type: 'entry',
      description: 'NFL Weekly Challenge Entry',
      amount: 25.00,
      date: 'Mar 9, 2025',
      time: '10:15 AM',
      status: 'Completed',
      paymentMethod: 'Wallet Balance',
      reference: 'ENT-87654321',
      processingFee: 0.00,
      details: 'Entry fee for NFL Weekly Challenge board',
      boardId: 'board1',
      boardName: 'NFL Weekly Challenge',
    },
    'tx3': {
      id: 'tx3',
      type: 'winnings',
      description: 'NBA Finals Showdown Winnings',
      amount: 75.50,
      date: 'Mar 5, 2025',
      time: '5:22 PM',
      status: 'Completed',
      paymentMethod: 'N/A',
      reference: 'WIN-54321678',
      processingFee: 0.00,
      details: 'Prize winnings from NBA Finals Showdown board',
      boardId: 'board3',
      boardName: 'NBA Finals Showdown',
    },
    'tx4': {
      id: 'tx4',
      type: 'withdrawal',
      description: 'Withdrawal to Chase Bank',
      amount: 50.00,
      date: 'Mar 1, 2025',
      time: '11:47 AM',
      status: 'Completed',
      paymentMethod: 'Chase Bank Account ending in 6789',
      reference: 'WIT-98765432',
      processingFee: 1.00,
      details: 'Funds withdrawn from your SquarePicks wallet',
    },
  };
  
  return transactions[id as keyof typeof transactions] || null;
};

// FaTrophy component for winnings
const FaTrophy = ({ className }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 576 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z" />
    </svg>
  );
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  
  // Get transaction data
  const transaction = getTransactionById(transactionId);
  
  // Handle back button
  const handleBack = () => {
    router.push('/wallet');
  };
  
  // Get icon by transaction type
  const getIconByType = (type: string) => {
    switch (type) {
      case 'deposit':
        return <FaPlus className="text-green-500" />;
      case 'withdrawal':
        return <FaMinus className="text-red-500" />;
      case 'winnings':
        return <FaTrophy className="text-accent-500" />;
      case 'entry':
        return <FaMoneyBillWave className="text-primary-500" />;
      default:
        return <FaExchangeAlt className="text-gray-400" />;
    }
  };
  
  // Get amount color by transaction type
  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'winnings':
        return 'text-green-500';
      case 'withdrawal':
      case 'entry':
        return 'text-red-500';
      default:
        return 'text-white';
    }
  };
  
  // Get amount prefix by transaction type
  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'winnings':
        return '+';
      case 'withdrawal':
      case 'entry':
        return '-';
      default:
        return '';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-500';
      case 'Pending':
        return 'text-yellow-500';
      case 'Failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <FaCheck className="mr-2" />;
      case 'Pending':
        return <FaHistory className="mr-2" />;
      case 'Failed':
        return <FaExchangeAlt className="mr-2" />;
      default:
        return <FaQuestionCircle className="mr-2" />;
    }
  };
  
  // If transaction not found
  if (!transaction) {
    return (
      <main className="min-h-screen flex flex-col bg-secondary-900">
        <Navbar />
        
        <div className="flex-grow pt-20">
          <div className="container-responsive py-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Transaction Not Found</h1>
            <p className="text-gray-400 mb-6">The transaction you're looking for doesn't exist or has been removed.</p>
            <Button 
              variant="primary"
              onClick={handleBack}
            >
              <FaChevronLeft className="mr-2" />
              Back to Wallet
            </Button>
          </div>
        </div>
        
        <Footer />
      </main>
    );
  }
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-8">
          <div className="container-responsive">
            <div className="flex items-center mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-white hover:bg-primary-800/50"
                onClick={handleBack}
              >
                <FaChevronLeft className="mr-2" />
                Back to Wallet
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Transaction Details</h1>
            <p className="text-primary-100">
              Reference: {transaction.reference}
            </p>
          </div>
        </div>
        
        {/* Transaction details */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            {/* Transaction header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-secondary-700 rounded-full flex items-center justify-center mr-4">
                    {getIconByType(transaction.type)}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-white">{transaction.description}</h2>
                    <div className="text-sm text-gray-400">
                      {transaction.date} at {transaction.time}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className={`text-2xl font-bold ${getAmountColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}${transaction.amount.toFixed(2)}
                  </div>
                  <div className={`flex items-center text-sm ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transaction details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Transaction Type</div>
                      <div className="text-white capitalize">{transaction.type}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Payment Method</div>
                      <div className="text-white">{transaction.paymentMethod}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Reference ID</div>
                      <div className="text-white">{transaction.reference}</div>
                    </div>
                    
                    {(transaction.type === 'entry' || transaction.type === 'winnings') && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Board</div>
                        <Link 
                          href={`/boards/${transaction.boardId}`}
                          className="text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          {transaction.boardName}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                  
                  <div className="bg-secondary-700 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white">${transaction.amount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Fee</span>
                        <span className="text-white">${transaction.processingFee.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-gray-600 my-2 pt-2 flex justify-between font-medium">
                        <span className="text-gray-300">Total</span>
                        <span className="text-white">
                          ${(transaction.amount + transaction.processingFee).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-white mb-2">Additional Information</h4>
                    <p className="text-sm text-gray-400">{transaction.details}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t border-gray-700 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="mr-2"
              >
                <FaDownload className="mr-2" />
                Download Receipt
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
              >
                <FaQuestionCircle className="mr-2" />
                Need Help?
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}