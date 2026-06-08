import { Timestamp } from "firebase/firestore";

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Study Materials
export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  fileType: "pdf" | "doc" | "docx" | "image";
  fileUrl: string;
  extractedText: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// AI Summaries
export interface Summary {
  id: string;
  userId: string;
  materialId: string;
  summaryType: "short" | "detailed" | "revision" | "keyConcepts" | "examPrep";
  title: string;
  content: string;
  createdAt: Timestamp;
}

// Flashcards (Polymorphic source resolution)
export interface Flashcard {
  id: string;
  userId: string;
  sourceType: "material" | "summary";
  sourceId: string; // references materialId or summaryId
  front: string;
  back: string;
  mastered: boolean;
  createdAt: Timestamp;
}

// Quiz Question Structure
export interface QuizQuestion {
  id: string;
  type: "mcq" | "shortAnswer" | "theory";
  question: string;
  options?: string[]; // for mcq
  answer: string; // correct answer or rubric guidance
  explanation?: string;
}

// User Answer Structure (Subjective theory fractional scoring resolution)
export interface UserAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean; // simple evaluation
  scoreFraction?: number; // 0.0 to 1.0 representation for subjective theory questions
  explanation: string;
}

// Quizzes
export interface Quiz {
  id: string;
  userId: string;
  materialId: string;
  title: string;
  questionType: "mcq" | "shortAnswer" | "theory" | "mixed";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  totalQuestions: number;
  questions: QuizQuestion[];
  createdAt: Timestamp;
}

// Quiz Attempts
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  percentage: number;
  grade: string;
  answers: UserAnswer[];
  weakTopics: string[];
  recommendations: string[];
  submittedAt: Timestamp;
}

// Study Rooms
export interface StudyRoom {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
  createdAt: Timestamp;
}

// Room Members
export interface StudyRoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: Timestamp;
}

// Study Room Messages (Q&A parent message ID resolution)
export interface StudyRoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: "question" | "answer";
  content: string;
  parentMessageId?: string; // links an "answer" message to its "question" message
  createdAt: Timestamp;
}

// AI Reviews
export interface AIReview {
  id: string;
  roomId: string;
  questionId: string; // studyRoomMessage ID of type question
  answerId: string; // studyRoomMessage ID of type answer
  score: number; // evaluation score e.g. 7
  strengths: string[];
  missingConcepts: string[];
  improvements: string[];
  modelAnswer: string;
  createdAt: Timestamp;
}

// AI Chat Sessions
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
}

// AI Chat Messages
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Timestamp;
}
