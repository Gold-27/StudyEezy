# StudyEezy

StudyEezy is an AI-powered collaborative learning and assessment platform designed to help students learn actively. Instead of just passively consuming answers, StudyEezy focuses on active recall, peer learning, and rigorous knowledge testing through AI-assisted quizzes and reviews.

## 🚀 Key Features

*   **Smart Authentication:** Secure email verification and Google Sign-In.
*   **Study Material Hub:** Upload PDFs, DOCs, or images (with OCR extraction) to centralize your notes.
*   **AI Summaries:** Automatically generate short, detailed, or exam-prep summaries from your uploaded materials.
*   **Flashcards:** Master key concepts with generated flashcards that support offline review.
*   **Adaptive Quizzes:** Generate customizable multiple-choice and short-answer quizzes. Grading and detailed AI feedback occur *after* submission to prevent shortcut learning.
*   **Collaborative Study Rooms:** Join rooms to ask questions, learn with peers, and request explicit "AI Reviews" on specific discussions.
*   **Voice Input:** Built-in Speech-to-Text for chat, rooms, and searches.
*   **Offline Support (PWA):** Access generated summaries, flashcards, and quiz histories even without an internet connection.

## 🛠️ Technology Stack

*   **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
*   **Backend:** Next.js Server Actions
*   **Database & Auth:** Firebase Firestore, Firebase Authentication, Firebase Storage
*   **AI Engine:** DeepSeek API
*   **Other Integrations:** Resend (Email Notifications), Google Vision API (OCR)

## ⚙️ Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd StudyEezy
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root of the project and populate it with your Firebase and API credentials:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-Side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"

# AI Integration
DEEPSEEK_API_KEY=your_deepseek_key

# Email Notifications
RESEND_API_KEY=your_resend_key
```

### 3. Local Development
Start the Next.js development server:
```bash
npm run dev
```
You can also run the Firebase Emulator if you are working on local Firestore testing:
```bash
firebase emulators:start --only firestore
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 📖 Core Philosophy

StudyEezy strictly prioritizes **learning effectiveness over convenience**. 
The AI is positioned as a tutor and evaluator—not a shortcut. For instance, in Study Rooms, the AI will *never* automatically answer a question; it waits until users attempt an answer, and then provides a structured review (strengths, missing concepts, model answer) when explicitly requested.
