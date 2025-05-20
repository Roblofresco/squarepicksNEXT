import React from 'react';

interface SignupProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

const SignupProgressDots: React.FC<SignupProgressDotsProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex justify-center items-center space-x-2 my-4"> {/* Added my-4 for spacing */}
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        return (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-blue-500' : 'bg-gray-600'}`}
            aria-label={`Step ${step} of ${totalSteps}${isActive ? ', current step' : ''}`}
          />
        );
      })}
    </div>
  );
};

export default SignupProgressDots; 