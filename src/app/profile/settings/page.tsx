"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, AlertCircle, Save, KeyRound, User, Shield, ArrowRight, X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

// Conditional Firebase imports to prevent SSR issues
let getDoc: any;
let setDoc: any;
let doc: any;
let db: any;

if (typeof window !== 'undefined') {
  const firestore = require('firebase/firestore');
  getDoc = firestore.getDoc;
  setDoc = firestore.setDoc;
  doc = firestore.doc;
  
  const { db: dbInstance } = require('@/lib/firebase');
  db = dbInstance;
}

const accountFormSchema = z.object({
  displayName: z.string()
    .min(3, { message: "Display name must be at least 3 characters." })
    .max(30, { message: "Display name must not be longer than 30 characters." }),
  phone: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface ProfileData {
  display_name?: string;
  phone?: string;
  email?: string;
}

const AccountSettingsPage = () => {
  const { user, loading: authLoading, reauthenticate, updateEmailAddress } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for Change Email Modal
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [changeEmailSuccess, setChangeEmailSuccess] = useState<string | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (authLoading || !db) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as ProfileData;
          setProfileData(data);
          form.reset({
            displayName: data.display_name || "",
            phone: data.phone || "",
          });
        }
      } catch (err) {
        setError("Failed to load profile data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, authLoading, form, db]);

  const onSubmit = async (data: AccountFormValues) => {
    if (!user) {
      setError("You must be logged in to save changes.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        display_name: data.displayName,
        phone: data.phone,
      }, { merge: true });

      setProfileData(prev => ({ ...prev, display_name: data.displayName, phone: data.phone } as ProfileData));
      setSuccessMessage("Your changes have been saved successfully.");
      form.reset(data); // Resets the form's dirty state
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsChangingEmail(true);
    setChangeEmailError(null);
    setChangeEmailSuccess(null);

    try {
      await updateEmailAddress(newEmail, currentPassword);

      // Also update in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { email: newEmail }, { merge: true });

      setProfileData(prev => prev ? { ...prev, email: newEmail } : { email: newEmail });
      setChangeEmailSuccess("Email updated successfully! A verification link may be sent to your new address.");
      setShowChangeEmailModal(false);
      setNewEmail('');
      setCurrentPassword('');

    } catch (err: any) {
      console.error("Error updating email:", err);
      if (err.code === 'auth/wrong-password' || err.message.includes('wrong-password')) {
        setChangeEmailError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setChangeEmailError("This email address is already in use by another account.");
      } else if (err.code === 'auth/invalid-email') {
        setChangeEmailError("The new email address is invalid.");
      } else {
        setChangeEmailError("Failed to update email. Please try again.");
      }
    } finally {
        setIsChangingEmail(false);
    }
  };

  const isFormUnchanged = useMemo(() => {
    const { displayName, phone } = form.getValues();
    return (
      displayName === (profileData?.display_name || "") &&
      phone === (profileData?.phone || "")
    );
  }, [form, profileData, form.watch('displayName'), form.watch('phone')]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-0 flex flex-col">
      <Breadcrumbs className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3" ellipsisOnly backHref="/profile" />
      <div className="mb-4 pl-4 sm:pl-6">
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        </div>

        {error && (
        <div className="mx-4 sm:mx-6 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2 text-red-500" /> 
            {error}
          </div>
        )}
        {successMessage && (
        <div className="mx-4 sm:mx-6 bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg p-3 mb-4">
            {successMessage}
          </div>
        )}

      <div className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }: { field: any }) => (
                <FormItem className="mb-6 group">
                  <FormLabel className="block text-xs font-medium text-white/70 mb-1">Display Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        className="w-full bg-transparent border-0 outline-none text-white text-lg placeholder-white/50 py-1 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <div className="h-px bg-gradient-to-r from-accent-2/45 via-accent-1/35 to-accent-2/45 transition-all group-focus-within:h-[2px]" />
                       <div className="pointer-events-none absolute inset-x-0 -top-2 opacity-0 group-focus-within:opacity-60">
                        <div className="h-4 w-full blur-md bg-[radial-gradient(ellipse_at_center,_rgba(27,176,242,0.28)_0%,_transparent_60%)]" />
                      </div>
            </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs mt-1" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }: { field: any }) => (
                <FormItem className="mb-6 group">
                  <FormLabel className="block text-xs font-medium text-white/70 mb-1">Phone Number</FormLabel>
                  <FormControl>
                     <div className="relative">
                       <Input
                        {...field}
                placeholder="(123) 456-7890"
                        className="w-full bg-transparent border-0 outline-none text-white text-lg placeholder-white/50 py-1 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                       />
                       <div className="h-px bg-gradient-to-r from-accent-2/45 via-accent-1/35 to-accent-2/45 transition-all group-focus-within:h-[2px]" />
                       <div className="pointer-events-none absolute inset-x-0 -top-2 opacity-0 group-focus-within:opacity-60">
                        <div className="h-4 w-full blur-md bg-[radial-gradient(ellipse_at_center,_rgba(27,176,242,0.28)_0%,_transparent_60%)]" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs mt-1" />
                </FormItem>
              )}
            />

            <div className="mb-6 group">
              <label className="block text-xs font-medium text-white/70 mb-1">Email Address (read‑only)</label>
              <div className="flex items-center justify-between py-1">
                <span className="text-white/90 text-lg truncate">{profileData?.email || 'Loading...'}</span>
                <span className="ml-3 text-[11px] text-white/60">🔒</span>
            </div>
              <div className="relative">
                <div className="h-px bg-gradient-to-r from-accent-2/45 via-accent-1/35 to-accent-2/45" />
              </div>
              <p className="text-xs text-white/50 mt-1">Email changes are handled separately for security.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
              type="submit"
                disabled={isSaving || isFormUnchanged || !form.formState.isValid}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 text-white font-medium rounded-md bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-95 focus:ring-2 focus:ring-white/10 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSaving ? <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</> : <><Save size={18} className="mr-2"/> Save Changes</>}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowChangeEmailModal(true); setChangeEmailError(null); setChangeEmailSuccess(null); }}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-white/10 text-white font-medium rounded-md hover:bg-white/15 focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-background active:scale-95 focus:scale-105 transition-all duration-150 border border-white/20 backdrop-blur-sm"
              >
                Change Email
              </Button>
            </div>
          </form>
        </Form>
        </div>

      <div className="mt-8 relative overflow-hidden rounded-t-3xl border-x border-t border-accent-1/30 flex flex-col flex-1">
        <div className="absolute inset-0 bg-background-primary/40" />
        <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-accent-2 via-accent-1/60 to-accent-2" />
        <div className="relative z-10 p-6 pb-0 flex flex-col h-full">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Shield size={20} className="mr-2 text-accent-1" /> Security
          </h2>
          <Link
            href="/profile/settings/change-password"
            className="flex items-center justify-between w-full p-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors duration-150 backdrop-blur-sm active:scale-95 focus:scale-105 outline-none"
          >
            <div className="flex items-center">
              <KeyRound size={18} className="mr-3 text-white/70"/>
              <span className="text-white/90">Change Password</span>
            </div>
            <ArrowRight size={16} className="text-white/60" />
          </Link>
          <Link
            href="/wallet-setup/personal-info"
            className="mt-4 flex items-center justify-between w-full p-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors duration-150 backdrop-blur-sm active:scale-95 focus:scale-105 outline-none"
          >
            <div className="flex items-center">
              <User size={18} className="mr-3 text-white/70"/>
              <span className="text-white/90">Edit Personal Details</span>
            </div>
            <ArrowRight size={16} className="text-white/60" />
          </Link>
          <div className="mt-4 text-xs text-white/50">
            For security reasons, email and password changes have their own dedicated pages.
          </div>
          <div className="mt-auto text-center text-xs text-white/70 border-t border-white/10 py-6">
            <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>
            <span className="mx-2">•</span>
            <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>

      {showChangeEmailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-background-primary border border-accent-1/20 p-6 sm:p-8 rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Change Email Address</h3>
              <button onClick={() => setShowChangeEmailModal(false)} className="text-white/70 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {changeEmailError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 mb-4 flex items-center">
                <AlertCircle size={18} className="mr-2 text-red-400" />
                {changeEmailError}
              </div>
            )}
            {changeEmailSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm rounded-lg p-3 mb-4">
                {changeEmailSuccess}
              </div>
            )}

            <form onSubmit={handleChangeEmail}>
              <div className="mb-4">
                <label htmlFor="newEmail" className="block text-sm font-medium text-white/80 mb-1">
                  New Email Address
                </label>
                <Input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-white/80 mb-1">
                  Current Password (for verification)
                </label>
                <Input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit"
                  disabled={isChangingEmail || !newEmail || !currentPassword}
                  className="w-full"
                >
                  {isChangingEmail ? <><Loader2 size={18} className="animate-spin mr-2" /> Updating Email...</> : 'Update Email'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowChangeEmailModal(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage; 