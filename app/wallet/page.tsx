'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  FaChevronRight,
  FaExchangeAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa'

// Tab component
const Tab = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
        isActive 
          ? 'bg-primary-700 text-white' 
          : 'bg-secondary-800 text-gray-400 hover:bg-secondary-700'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Transaction card component
const TransactionCard = ({ 
  transaction
}: { 
  transaction: any;
}) => {
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
  
  return (
    <div className="p-4 border-b border-gray-700 hover:bg-secondary-700 transition-colors">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-secondary-700 rounded-full flex items-center justify-center mr-4">
          {getIconByType(transaction.type)}
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-white">{transaction.description}</span>
            <span className={`font-medium ${getAmountColor(transaction.type)}`}>
              {getAmountPrefix(transaction.type)}${transaction.amount.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{transaction.date}</span>
            <span className="text-sm text-gray-400">{transaction.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock payment methods
const paymentMethods = [
  {
    id: 'card1',
    type: 'card',
    name: 'Visa ending in 4242',
    last4: '4242',
    expiry: '12/25',
    isDefault: true,
  },
  {
    id: 'bank1',
    type: 'bank',
    name: 'Chase Bank Account',
    last4: '6789',
    isDefault: false,
  }
];

// Mock transactions
const transactions = [
  {
    id: 'tx1',
    type: 'deposit',
    description: 'Deposit via Visa',
    amount: 100.00,
    date: 'Mar 10, 2025',
    status: 'Completed',
  },
  {
    id: 'tx2',
    type: 'entry',
    description: 'NFL Weekly Challenge Entry',
    amount: 25.00,
    date: 'Mar 9, 2025',
    status: 'Completed',
  },
  {
    id: 'tx3',
    type: 'winnings',
    description: 'NBA Finals Showdown Winnings',
    amount: 75.50,
    date: 'Mar 5, 2025',
    status: 'Completed',
  },
  {
    id: 'tx4',
    type: 'withdrawal',
    description: 'Withdrawal to Chase Bank',
    amount: 50.00,
    date: 'Mar 1, 2025',
    status: 'Completed',
  },
];

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

export default function WalletPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('balance');
  
  // Handle add funds
  const handleAddFunds = () => {
    router.push('/wallet/deposit');
  };
  
  // Handle withdraw
  const handleWithdraw = () => {
    router.push('/wallet/withdraw');
  };
  
  // Handle add payment method
  const handleAddPaymentMethod = () => {
    router.push('/wallet/add-payment-method');
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <Navbar />
      
      <div className="flex-grow pt-20">
        {/* Header section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-8">
          <div className="container-responsive">
            <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
            <p className="text-primary-100">
              Manage your funds, payment methods, and transaction history
            </p>
          </div>
        </div>
        
        {/* Balance card */}
        <div className="container-responsive py-6">
          <div className="bg-gradient-to-r from-secondary-800 to-secondary-700 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <div className="text-sm text-gray-400 mb-1">Available Balance</div>
                <div className="text-4xl font-bold text-white mb-2">$100.50</div>
                <div className="flex space-x-4">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddFunds}
                  >
                    <FaPlus className="mr-2" size={12} />
                    Add Funds
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleWithdraw}
                  >
                    <FaMinus className="mr-2" size={12} />
                    Withdraw
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary-900/50 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaArrowUp className="text-primary-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Total Deposits</div>
                  <div className="text-xl font-bold text-white">$100.00</div>
                </div>
                
                <div className="bg-secondary-900/50 rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-accent-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaTrophy className="text-accent-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Total Winnings</div>
                  <div className="text-xl font-bold text-white">$75.50</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs and content */}
        <div className="container-responsive py-6">
          <div className="bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex space-x-2">
                <Tab 
                  label="Balance" 
                  isActive={activeTab === 'balance'} 
                  onClick={() => setActiveTab('balance')} 
                />
                <Tab 
                  label="Payment Methods" 
                  isActive={activeTab === 'payment-methods'} 
                  onClick={() => setActiveTab('payment-methods')} 
                />
                <Tab 
                  label="Transactions" 
                  isActive={activeTab === 'transactions'} 
                  onClick={() => setActiveTab('transactions')} 
                />
              </div>
            </div>
            
            {/* Tab content */}
            <div>
              {activeTab === 'balance' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Balance Summary</h3>
                    <div className="bg-secondary-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Available</div>
                          <div className="text-xl font-bold text-white">$100.50</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Pending</div>
                          <div className="text-xl font-bold text-white">$0.00</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Reserved</div>
                          <div className="text-xl font-bold text-white">$0.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                    <div className="bg-secondary-700 rounded-lg overflow-hidden">
                      {transactions.slice(0, 3).map((transaction) => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                      ))}
                      <div className="p-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab('transactions')}
                        >
                          View All Transactions
                          <FaChevronRight className="ml-2" size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'payment-methods' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddPaymentMethod}
                    >
                      <FaPlus className="mr-2" size={12} />
                      Add Method
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id}
                        className="bg-secondary-700 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-secondary-600 rounded-full flex items-center justify-center mr-4">
                            {method.type === 'card' ? (
                              <FaCreditCard className="text-primary-400" />
                            ) : (
                              <FaMoneyBillWave className="text-accent-400" />
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium text-white">{method.name}</div>
                            <div className="text-sm text-gray-400">
                              {method.type === 'card' ? `Expires ${method.expiry}` : 'Bank Account'}
                              {method.isDefault && (
                                <span className="ml-2 px-2 py-0.5 bg-primary-900 text-primary-300 rounded-full text-xs">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'transactions' && (
                <div>
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                    <div className="flex space-x-2">
                      <select className="bg-secondary-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600">
                        <option>All Types</option>
                        <option>Deposits</option>
                        <option>Withdrawals</option>
                        <option>Entries</option>
                        <option>Winnings</option>
                      </select>
                      <select className="bg-secondary-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-700">
                    {transactions.map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                  
                  <div className="p-4 flex justify-center">
                    <Button variant="outline" size="sm">
                      Load More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}