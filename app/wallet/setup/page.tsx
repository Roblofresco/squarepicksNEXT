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
  FaCreditCard, 
  FaMoneyBillWave, 
  FaChevronRight, 
  FaChevronLeft,
  FaLock,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa'

// Step indicator component
const StepIndicator = ({ 
  currentStep, 
  totalSteps 
}: { 
  currentStep: number; 
  totalSteps: number;
}) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index < currentStep 
                ? 'bg-primary-600 text-white' 
                : index === currentStep 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-secondary-700 text-gray-400'
            }`}
          >
            {index < currentStep ? (
              <FaCheckCircle />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          
          {index < totalSteps - 1 && (
            <div 
              className={`w-12 h-1 ${
                index < currentStep 
                  ? 'bg-primary-600' 
                  : 'bg-secondary-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Payment method card component
const PaymentMethodCard = ({ 
  method, 
  isSelected, 
  onClick 
}: { 
  method: { id: string; name: string; icon: React.ReactNode; }; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-primary-900/30 border border-primary-500' 
          : 'bg-secondary-700 border border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-secondary-600 rounded-full flex items-center justify-center mr-3">
          {method.icon}
        </div>
        <span className="font-medium text-white">{method.name}</span>
      </div>
    </div>
  );
};

export default function WalletSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  // Payment methods
  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit or Debit Card',
      icon: <FaCreditCard className="text-primary-400" />,
    },
    {
      id: 'bank-account',
      name: 'Bank Account',
      icon: <FaMoneyBillWave className="text-accent-400" />,
    },
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    bankName: '',
  });
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup
      router.push('/wallet');
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle method selection
  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };
  
  // Check if next button should be disabled
  const isNextDisabled = () => {
    if (currentStep === 0) {
      return !selectedMethod;
    } else if (currentStep === 1) {
      if (selectedMethod === 'credit-card') {
        return !formData.cardNumber || !formData.cardholderName || !formData.expiryDate || !formData.cvv;
      } else if (selectedMethod === 'bank-account') {
        return !formData.accountNumber || !formData.routingNumber || !formData.accountName || !formData.bankName;
      }
    }
    return false;
  };
  
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
                onClick={() => router.push('/wallet')}
              >
                <FaChevronLeft className="mr-2" />
                Back to Wallet
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Set Up Your Wallet</h1>
            <p className="text-primary-100">
              Add a payment method to start making deposits and withdrawals
            </p>
          </div>
        </div>
        
        {/* Setup steps */}
        <div className="container-responsive py-8">
          <div className="max-w-2xl mx-auto bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <StepIndicator currentStep={currentStep} totalSteps={3} />
              
              {/* Step 1: Choose payment method */}
              {currentStep === 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white text-center mb-6">
                    Choose a Payment Method
                  </h2>
                  
                  <div className="space-y-4 mb-8">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard 
                        key={method.id}
                        method={method}
                        isSelected={selectedMethod === method.id}
                        onClick={() => handleMethodSelect(method.id)}
                      />
                    ))}
                  </div>
                  
                  <div className="bg-secondary-700 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <FaShieldAlt className="text-primary-400 mt-1 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Secure Transactions</h3>
                        <p className="text-sm text-gray-400">
                          All payment information is encrypted and securely stored. We never share your financial details with third parties.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Enter payment details */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-white text-center mb-6">
                    {selectedMethod === 'credit-card' 
                      ? 'Enter Card Details' 
                      : 'Enter Bank Account Details'}
                  </h2>
                  
                  {selectedMethod === 'credit-card' ? (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Card Number
                        </label>
                        <input 
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Cardholder Name
                        </label>
                        <input 
                          type="text"
                          name="cardholderName"
                          value={formData.cardholderName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Expiry Date
                          </label>
                          <input 
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            CVV
                          </label>
                          <input 
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Bank Name
                        </label>
                        <input 
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          placeholder="Chase Bank"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Account Holder Name
                        </label>
                        <input 
                          type="text"
                          name="accountName"
                          value={formData.accountName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Routing Number
                        </label>
                        <input 
                          type="text"
                          name="routingNumber"
                          value={formData.routingNumber}
                          onChange={handleInputChange}
                          placeholder="123456789"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Account Number
                        </label>
                        <input 
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          placeholder="987654321"
                          className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center mb-6">
                    <FaLock className="text-primary-400 mr-2" />
                    <span className="text-sm text-gray-400">
                      Your information is secure and encrypted
                    </span>
                  </div>
                </div>
              )}
              
              {/* Step 3: Confirmation */}
              {currentStep === 2 && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-primary-500 text-4xl" />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Payment Method Added Successfully
                  </h2>
                  
                  <p className="text-gray-400 mb-6">
                    Your {selectedMethod === 'credit-card' ? 'card' : 'bank account'} has been successfully added to your wallet. You can now make deposits and withdrawals.
                  </p>
                  
                  <div className="bg-secondary-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      {selectedMethod === 'credit-card' ? (
                        <FaCreditCard className="text-primary-400 mr-3" />
                      ) : (
                        <FaMoneyBillWave className="text-accent-400 mr-3" />
                      )}
                      
                      <div className="text-left">
                        <div className="font-medium text-white">
                          {selectedMethod === 'credit-card' 
                            ? `Card ending in ${formData.cardNumber.slice(-4)}` 
                            : `${formData.bankName} account ending in ${formData.accountNumber.slice(-4)}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedMethod === 'credit-card' 
                            ? `Expires ${formData.expiryDate}` 
                            : `Account holder: ${formData.accountName}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-6">
                    You can manage your payment methods in your wallet settings at any time.
                  </div>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="flex justify-between">
                {currentStep > 0 ? (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStep}
                  >
                    <FaChevronLeft className="mr-2" />
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}
                
                <Button 
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={isNextDisabled()}
                >
                  {currentStep === 2 ? 'Go to Wallet' : 'Continue'}
                  <FaChevronRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}