# SquarePicks - Next.js Web Application

SquarePicks is a sports prediction platform that allows users to make picks on sports events, participate in sweepstakes, and compete with friends without risking real money.

## 🚀 Features

- **User Authentication**: Secure login and registration with Firebase
- **Sports Predictions**: Make picks across multiple sports and leagues
- **Leaderboards**: Compete with friends and track your performance
- **Prizes**: Win real prizes for accurate predictions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes

## 🛠️ Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth)
- **Database**: [Firestore](https://firebase.google.com/products/firestore)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## 📋 Pages

- **Home**: Landing page with hero section, features, testimonials, and CTA
- **Sports**: Browse available sports and leagues
- **My Picks**: View and manage your picks
- **Leaderboard**: See how you rank against other users
- **Profile**: Manage your account and settings
- **Authentication**: Login, registration, and password reset

## 🚀 Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Roblofresco/squarepicksNEXT.git
   cd squarepicksNEXT
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
squarepicksNEXT/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   └── ...               # Other pages and layouts
├── components/           # React components
│   ├── ui/               # UI components
│   ├── sections/         # Page sections
│   └── ...               # Other components
├── lib/                  # Utility functions and libraries
│   ├── firebase.ts       # Firebase configuration
│   └── utils.ts          # Utility functions
├── providers/            # Context providers
│   ├── AuthProvider.tsx  # Authentication provider
│   └── ThemeProvider.tsx # Theme provider
├── public/               # Static assets
├── styles/               # Additional styles
└── ...                   # Configuration files
```

## 🌐 Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Set the environment variables.
4. Deploy!

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)