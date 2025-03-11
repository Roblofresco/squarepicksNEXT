'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { 
  FaChevronRight, 
  FaChevronLeft, 
  FaCheckCircle,
  FaFootballBall,
  FaBasketballBall,
  FaBaseballBall,
  FaHockeyPuck,
  FaFutbol
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
            className={`w-3 h-3 rounded-full ${
              index < currentStep 
                ? 'bg-primary-500' 
                : index === currentStep 
                  ? 'bg-primary-400' 
                  : 'bg-gray-600'
            }`}
          />
          
          {index < totalSteps - 1 && (
            <div 
              className={`w-8 h-1 ${
                index < currentStep 
                  ? 'bg-primary-500' 
                  : 'bg-gray-600'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Sport selection card
const SportCard = ({ 
  sport, 
  isSelected, 
  onClick 
}: { 
  sport: { id: string; name: string; icon: React.ReactNode; }; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-primary-900/30 border border-primary-500' 
          : 'bg-secondary-800 border border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 bg-secondary-700 rounded-full flex items-center justify-center mr-3">
          {sport.icon}
        </div>
        <span className="font-medium text-white">{sport.name}</span>
        
        {isSelected && (
          <FaCheckCircle className="ml-auto text-primary-500" />
        )}
      </div>
    </div>
  );
};

// Notification preference card
const NotificationCard = ({ 
  notification, 
  isSelected, 
  onClick 
}: { 
  notification: { id: string; title: string; description: string; }; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-primary-900/30 border border-primary-500' 
          : 'bg-secondary-800 border border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white">{notification.title}</span>
        
        <div 
          className={`w-6 h-6 rounded-full border ${
            isSelected 
              ? 'border-primary-500 bg-primary-500' 
              : 'border-gray-600'
          } flex items-center justify-center`}
        >
          {isSelected && <FaCheckCircle className="text-white text-sm" />}
        </div>
      </div>
      
      <p className="text-sm text-gray-400">{notification.description}</p>
    </div>
  );
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  
  // Sports options
  const sportsOptions = [
    {
      id: 'nfl',
      name: 'NFL Football',
      icon: <FaFootballBall className="text-primary-400" />,
    },
    {
      id: 'nba',
      name: 'NBA Basketball',
      icon: <FaBasketballBall className="text-accent-500" />,
    },
    {
      id: 'mlb',
      name: 'MLB Baseball',
      icon: <FaBaseballBall className="text-red-500" />,
    },
    {
      id: 'nhl',
      name: 'NHL Hockey',
      icon: <FaHockeyPuck className="text-blue-500" />,
    },
    {
      id: 'soccer',
      name: 'Soccer',
      icon: <FaFutbol className="text-green-500" />,
    },
  ];
  
  // Notification options
  const notificationOptions = [
    {
      id: 'game-reminders',
      title: 'Game Reminders',
      description: 'Get notified before games you\'ve picked start',
    },
    {
      id: 'pick-deadlines',
      title: 'Pick Deadlines',
      description: 'Reminders when pick deadlines are approaching',
    },
    {
      id: 'results',
      title: 'Game Results',
      description: 'Get notified when games you\'ve picked end',
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Special offers, contests, and promotions',
    },
  ];
  
  // Handle sport selection
  const handleSportSelect = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter(id => id !== sportId));
    } else {
      setSelectedSports([...selectedSports, sportId]);
    }
  };
  
  // Handle notification selection
  const handleNotificationSelect = (notificationId: string) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push('/dashboard');
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    router.push('/dashboard');
  };
  
  // Check if next button should be disabled
  const isNextDisabled = () => {
    if (currentStep === 0) {
      return username.trim().length < 3;
    } else if (currentStep === 1) {
      return selectedSports.length === 0;
    }
    return false;
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-secondary-900">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image 
              src="/images/logo.png" 
              alt="SquarePicks Logo" 
              width={120} 
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to SquarePicks</h1>
            <p className="text-gray-400">Let's set up your account</p>
          </div>
          
          <div className="bg-secondary-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <StepIndicator currentStep={currentStep} totalSteps={4} />
              
              {/* Step 1: Username */}
              {currentStep === 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white text-center mb-6">
                    Choose a Username
                  </h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. SportsFan42"
                      className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-sm text-gray-400">
                      This is how other users will see you on SquarePicks
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 2: Sports preferences */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-white text-center mb-6">
                    Select Your Favorite Sports
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    {sportsOptions.map((sport) => (
                      <SportCard 
                        key={sport.id}
                        sport={sport}
                        isSelected={selectedSports.includes(sport.id)}
                        onClick={() => handleSportSelect(sport.id)}
                      />
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    You can change these preferences later in your account settings
                  </p>
                </div>
              )}
              
              {/* Step 3: Notification preferences */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-white text-center mb-6">
                    Notification Preferences
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    {notificationOptions.map((notification) => (
                      <NotificationCard 
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotifications.includes(notification.id)}
                        onClick={() => handleNotificationSelect(notification.id)}
                      />
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    You can manage your notification settings at any time
                  </p>
                </div>
              )}
              
              {/* Step 4: Completion */}
              {currentStep === 3 && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-primary-500 text-4xl" />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-4">
                    You're All Set!
                  </h2>
                  
                  <p className="text-gray-400 mb-6">
                    Thanks for setting up your account, {username}. You're ready to start making picks and competing with friends!
                  </p>
                  
                  <div className="bg-secondary-700 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-medium text-white mb-2">What's Next?</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-primary-500 mt-1 mr-2" />
                        Browse upcoming games and make your picks
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-primary-500 mt-1 mr-2" />
                        Join or create pick'em boards with friends
                      </li>
                      <li className="flex items-start">
                        <FaCheckCircle className="text-primary-500 mt-1 mr-2" />
                        Set up your wallet to participate in paid contests
                      </li>
                    </ul>
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
                  <Button 
                    variant="ghost" 
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                )}
                
                <Button 
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={isNextDisabled()}
                >
                  {currentStep === 3 ? 'Get Started' : 'Continue'}
                  <FaChevronRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}