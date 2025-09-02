# Service Account Keys & API Credentials

## Firebase Service Account Key

### Setup Instructions

1. **Get your service account key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Place the file:**
   - Rename the downloaded file to `firebase-admin-key.json`
   - Place it in this `certificates/` directory

3. **Update environment:**
   - Copy `firebase-env-template.txt` to `.env.local`
   - Fill in your Firebase project values
   - The `GOOGLE_APPLICATION_CREDENTIALS` should point to this file

## PayPal Configuration

### Setup Instructions

1. **Get PayPal credentials:**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Create or select your app
   - Copy Client ID and Client Secret

2. **Update environment:**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
     PAYPAL_CLIENT_SECRET=your_client_secret
     ```

## Stripe Configuration

### Setup Instructions

1. **Get Stripe credentials:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to Developers → API Keys
   - Copy Publishable Key and Secret Key

2. **Update environment:**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
     STRIPE_SECRET_KEY=sk_test_...
     ```

## Security Notes

- **Never commit** any credential files to git
- The `certificates/` directory is already in `.gitignore`
- Keep all API keys and secrets secure
- Rotate keys periodically
- Use test keys for development, live keys for production

## File Structure
```
certificates/
├── README.md (this file)
└── firebase-admin-key.json (your Firebase service account key)
```
