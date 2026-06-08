# DATABASE_DESIGN.md

# StudyEezy Database Design

Version: 1.0

Status: MVP

Database Provider: Firebase Firestore

---

# Overview

This document defines the Firestore database structure for StudyEezy.

The database must support:

- Authentication
- Study Materials
- Summaries
- Flashcards
- Quizzes
- Quiz Attempts
- Study Rooms
- AI Reviews
- AI Chat
- Offline Synchronization

---

# Design Principles

## User-Centric

Every major resource belongs to a user.

Examples:

- Materials
- Summaries
- Flashcards
- Quizzes
- Chat Sessions

---

## Offline-Friendly

Collections should support Firestore offline persistence.

---

## Scalable

Structure should support future growth without major redesign.

---

# Collections Overview

```text
users

studyMaterials

summaries

flashcards

quizzes

quizAttempts

studyRooms

studyRoomMembers

studyRoomMessages

aiReviews

chatSessions

chatMessages
```

---

# users

Stores user profile information.

## Document ID

```text
userId
```

## Fields

```typescript
{
  id: string
  name: string
  email: string
  emailVerified: boolean

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

# studyMaterials

Stores uploaded learning materials.

## Document ID

```text
materialId
```

## Fields

```typescript
{
  id: string

  userId: string

  title: string

  fileType:
    | "pdf"
    | "doc"
    | "docx"
    | "image"

  fileUrl: string

  extractedText: string

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

# summaries

Stores AI-generated summaries.

## Document ID

```text
summaryId
```

## Fields

```typescript
{
  id: string

  userId: string

  materialId: string

  summaryType:
    | "short"
    | "detailed"
    | "revision"
    | "keyConcepts"
    | "examPrep"

  title: string

  content: string

  createdAt: Timestamp
}
```

---

# flashcards

Stores generated flashcards.

## Document ID

```text
flashcardId
```

## Fields

```typescript
{
  id: string

  userId: string

  materialId: string

  front: string

  back: string

  mastered: boolean

  createdAt: Timestamp
}
```

---

# quizzes

Stores generated quizzes.

## Document ID

```text
quizId
```

## Fields

```typescript
{
  id: string

  userId: string

  materialId: string

  title: string

  questionType:
    | "mcq"
    | "shortAnswer"
    | "theory"
    | "mixed"

  difficulty:
    | "easy"
    | "medium"
    | "hard"
    | "mixed"

  totalQuestions: number

  questions: QuizQuestion[]

  createdAt: Timestamp
}
```

---

# Quiz Question Structure

```typescript
{
  id: string

  type:
    | "mcq"
    | "shortAnswer"
    | "theory"

  question: string

  options?: string[]

  answer: string

  explanation?: string
}
```

---

# quizAttempts

Stores completed quiz submissions.

## Document ID

```text
attemptId
```

## Fields

```typescript
{
  id: string

  userId: string

  quizId: string

  score: number

  percentage: number

  grade: string

  answers: UserAnswer[]

  weakTopics: string[]

  recommendations: string[]

  submittedAt: Timestamp
}
```

---

# User Answer Structure

```typescript
{
  questionId: string

  userAnswer: string

  correctAnswer: string

  correct: boolean

  explanation: string
}
```

---

# studyRooms

Stores study rooms.

## Document ID

```text
roomId
```

## Fields

```typescript
{
  id: string

  ownerId: string

  name: string

  inviteCode: string

  createdAt: Timestamp
}
```

---

# studyRoomMembers

Stores room membership.

## Document ID

```text
membershipId
```

## Fields

```typescript
{
  id: string

  roomId: string

  userId: string

  role:
    | "owner"
    | "member"

  joinedAt: Timestamp
}
```

---

# studyRoomMessages

Stores questions and answers inside study rooms.

## Document ID

```text
messageId
```

## Fields

```typescript
{
  id: string

  roomId: string

  senderId: string

  type:
    | "question"
    | "answer"

  content: string

  createdAt: Timestamp
}
```

---

# aiReviews

Stores AI review responses.

## Document ID

```text
reviewId
```

## Fields

```typescript
{
  id: string

  roomId: string

  questionId: string

  answerId: string

  score: number

  strengths: string[]

  missingConcepts: string[]

  improvements: string[]

  modelAnswer: string

  createdAt: Timestamp
}
```

---

# chatSessions

Stores AI chat sessions.

## Document ID

```text
sessionId
```

## Fields

```typescript
{
  id: string

  userId: string

  title: string

  createdAt: Timestamp
}
```

---

# chatMessages

Stores AI chat messages.

## Document ID

```text
messageId
```

## Fields

```typescript
{
  id: string

  sessionId: string

  role:
    | "user"
    | "assistant"

  content: string

  createdAt: Timestamp
}
```

---

# Relationships

```text
User
│
├── Study Materials
│
├── Summaries
│
├── Flashcards
│
├── Quizzes
│
├── Quiz Attempts
│
├── Chat Sessions
│
└── Study Rooms
```

---

# Offline Requirements

Must be available offline:

- Study Materials
- Summaries
- Flashcards
- Quiz Attempts
- Study Room History
- Chat History Already Synced

Must NOT be generated offline:

- Summaries
- Quizzes
- AI Reviews
- AI Chat Responses

---

# Indexing Recommendations

Create Firestore indexes for:

```text
userId

roomId

quizId

materialId

sessionId
```

These fields will be queried frequently.

---

# Security Rules

Users may only access:

- Their own materials
- Their own summaries
- Their own flashcards
- Their own quizzes
- Their own quiz attempts
- Their own chat sessions

Exception:

Study Room members may access room content for rooms they belong to.

---

# Source Of Truth

This document must remain aligned with:

1. PRD.pdf
2. AGENTS.md
3. ARCHITECTURE.md

If conflicts occur:

PRD.md takes precedence.