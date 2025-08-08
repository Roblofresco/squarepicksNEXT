# Knowledge: PersonalInfoForm Component (`@/components/ui/PersonalInfoForm.tsx`)

## 1. Overview & Purpose
- Reusable form for collecting personal info during wallet setup.

## 2. Key Responsibilities & Functionality
- Controlled inputs for name, phone, address.
- Error display and submit disabled state.

## 3. Props (as used)
- `formData`
- `onChange(e)`
- `onSubmit(e)`
- `isSubmitting: boolean`
- `error?: string | null`
- `verifiedState?: string | null`

## 4. Where Used
- `src/app/wallet-setup/personal-info/page.tsx`. 