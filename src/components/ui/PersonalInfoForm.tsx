import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  postalCode: string;
}

interface PersonalInfoFormProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string | null;
  verifiedState: string | null;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  verifiedState,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          name="firstName"
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={onChange}
          required
          className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          disabled={isSubmitting}
          title="Enter your first name as it appears on official documents."
        />
        <Input
          name="lastName"
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={onChange}
          required
          className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          disabled={isSubmitting}
          title="Enter your last name as it appears on official documents."
        />
      </div>
      <Input
        name="phone"
        type="tel"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={onChange}
        required
        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
        disabled={isSubmitting}
        title="Enter your 10-digit phone number."
      />
      <Input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={onChange}
        required
        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
        disabled={isSubmitting}
        title="Enter your email address."
      />
      <Input
        name="street"
        type="text"
        placeholder="Street Address"
        value={formData.street}
        onChange={onChange}
        required
        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
        disabled={isSubmitting}
        title="Enter your street address."
      />
      <Input
        name="city"
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={onChange}
        required
        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
        disabled={isSubmitting}
        title="Enter your city."
      />
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          name="stateDisplay"
          type="text"
          placeholder="State"
          value={verifiedState || ''}
          readOnly
          className="flex-1 bg-gray-600 border-gray-500 text-gray-300 placeholder-gray-400 cursor-not-allowed"
          aria-label="State (verified)"
        />
        <Input
          name="postalCode"
          type="text"
          placeholder="Postal Code"
          value={formData.postalCode}
          onChange={onChange}
          required
          className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          disabled={isSubmitting}
          title="Enter your postal code."
        />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-primary-blue hover:bg-primary-blue-dark active:scale-95 text-white font-semibold mt-6 transition-all duration-150 ease-in-out"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Information'}
      </Button>
    </form>
  );
};

export default PersonalInfoForm; 