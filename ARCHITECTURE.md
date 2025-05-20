# SquarePicks LLC - Application Architecture Overview (Internal Use)

**Purpose:** To provide a high-level overview of the technical architecture of the SquarePicks application for developers and technical stakeholders.

**Last Updated:** 4/10/2025

---

## 1. Frontend (Mobile Application)

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** [Specify, e.g., React Context, Zustand, Redux Toolkit]
*   **Key Libraries/Components:**
    *   `next/link` (Routing)
    *   `next/image` (Image Optimization)
    *   `lucide-react` (Icons)
    *   [List other major UI libraries or custom component libraries]
*   **Build/Packaging:** [Specify if using native wrappers like Capacitor/Expo or PWA details]

---

## 2. Backend (API & Services)

*   **Framework/Platform:** [Specify, e.g., Node.js with Express, Python with Django/Flask, Serverless (AWS Lambda/Google Cloud Functions)]
*   **Language:** [Specify, e.g., TypeScript, Python, Go]
*   **API Style:** [Specify, e.g., RESTful API, GraphQL]
*   **Authentication/Authorization:** [Specify method, e.g., JWT, OAuth, Session-based]
*   **Key Services/Microservices (if applicable):**
    *   User Service (Handles accounts, profiles)
    *   Board Service (Manages game boards, squares, numbers)
    *   Payment Service (Integrates with PayPal/Stripe)
    *   Notification Service (Handles push/in-app notifications)
    *   Sweepstakes Logic Service (Manages AMOE, winner selection)
*   **Key Libraries/Tools:** [List major backend libraries, ORMs, etc.]

---

## 3. Database

*   **Primary Database:** [Specify, e.g., PostgreSQL, MySQL, MongoDB, Firestore]
*   **Schema Overview:** [Briefly describe major tables/collections, e.g., Users, Boards, Entries, Transactions]
*   **Caching:** [Specify if using Redis, Memcached, etc.]
*   **ORM/Query Builder:** [Specify, e.g., Prisma, TypeORM, SQLAlchemy, Mongoose]

---

## 4. Infrastructure & Hosting

*   **Cloud Provider:** [Specify, e.g., Vercel, AWS, Google Cloud, Azure, Netlify]
*   **Hosting Services:** [Specify, e.g., Vercel Functions, AWS EC2/ECS/Lambda, Google App Engine/Cloud Run]
*   **Database Hosting:** [Specify, e.g., Supabase, AWS RDS, MongoDB Atlas, Self-hosted]
*   **CDN:** [Specify, e.g., Cloudflare, AWS CloudFront, Vercel Edge Network]
*   **Monitoring/Logging:** [Specify tools, e.g., Sentry, Datadog, New Relic, CloudWatch Logs]

---

## 5. Third-Party Services

*   **Payment Processing:** [Specify, e.g., PayPal API, Stripe API]
*   **Identity Verification:** [Specify, e.g., Jumio, Veriff, Socure]
*   **Email Service:** [Specify, e.g., SendGrid, Mailgun, AWS SES]
*   **Analytics:** [Specify, e.g., Google Analytics, Mixpanel, Amplitude]
*   **Push Notifications:** [Specify, e.g., Firebase Cloud Messaging (FCM), OneSignal]

---

## 6. Data Flow Examples (Optional)

*   **User Login:** [Describe steps: Request -> Backend Auth -> JWT -> Frontend Storage]
*   **Entering a Board:** [Describe steps: Select Square -> API Call -> Payment Intent -> Confirmation -> Database Update]
*   **Board Closure & Winner Selection:** [Describe steps: Cron Job/Scheduled Task -> Fetch Entries -> Random Selection Algo -> Update Board Status -> Notify Winners]

---

**Diagrams:**
*   [Link to High-Level Architecture Diagram, if available]

---

**Contact:** For questions about the architecture, contact [Name/Role, e.g., Lead Developer, CTO]. 