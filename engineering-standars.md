# ENGINEERING_STANDARDS.md

# StudyEezy Engineering Standards

Version: 1.0

Status: MVP

---

# Purpose

This document defines engineering standards for StudyEezy.

The goal is to ensure:

- Consistent code quality
- Predictable architecture
- Maintainable codebase
- Reliable AI-generated code

All development must follow these standards.

---

# Core Principles

## Simplicity First

Prefer simple solutions.

Avoid unnecessary abstractions.

Avoid premature optimization.

---

## Mobile First

All UI implementations must prioritize mobile devices.

Mobile experience is the primary experience.

---

## Type Safety

Use TypeScript everywhere.

Avoid:

```typescript
any
```

Prefer:

```typescript
interface
type
```

---

## Feature-Based Organization

Organize code by feature.

Avoid organizing by file type alone.

Preferred:

```text
features/
├── auth
├── summaries
├── flashcards
├── quizzes
├── study-rooms
```

---

# Folder Structure

```text
src

├── app
├── actions
├── features
├── components
├── firebase
├── lib
├── hooks
├── services
├── validators
├── types
├── constants
└── utils
```

---

# Naming Conventions

## Components

Use PascalCase.

Examples:

```text
SummaryCard.tsx
QuizResultsCard.tsx
StudyRoomCard.tsx
```

---

## Hooks

Use camelCase with use prefix.

Examples:

```text
useAuth.ts
useQuiz.ts
useStudyRoom.ts
```

---

## Utilities

Use camelCase.

Examples:

```text
formatDate.ts
calculateScore.ts
```

---

## Server Actions

Use verb-based naming.

Examples:

```text
createQuiz.ts
generateSummary.ts
submitQuiz.ts
requestAiReview.ts
```

---

# Component Rules

## Components Must Be Small

Prefer:

```text
SummaryCard
```

Instead of:

```text
MegaDashboardComponent
```

---

## Single Responsibility

Each component should do one thing well.

---

## Reusability

Extract repeated UI into reusable components.

---

# Styling Standards

## Use Design Tokens

Consume values from:

```text
design-tokens.css
```

---

## Never Hardcode

Avoid:

```css
color: #4F46E5;
padding: 16px;
```

Use tokens instead.

---

## Mobile First Styling

Build mobile layouts first.

Enhance for larger screens afterward.

---

# Firebase Standards

## Authentication

Use Firebase Authentication only.

Supported:

- Sign Up
- Login
- Logout
- Password Reset
- Email Verification

---

## Firestore

Store structured application data.

Avoid deeply nested collections unless necessary.

---

## Storage

Use Firebase Storage for:

- PDFs
- Documents
- Images

Do not store files in Firestore.

---

# Server Actions Standards

Server Actions are the primary backend pattern.

Expected usage:

```text
80-90% Server Actions
10-20% Route Handlers
```

---

## Server Actions Responsibilities

- Validation
- Authentication Checks
- Firestore Operations
- AI Calls
- Business Logic

---

## Route Handlers

Use only when necessary.

Examples:

- Webhooks
- External Integrations

---

# Validation Standards

Use:

```text
Zod
```

For all validation.

---

## Validate

- Forms
- AI Inputs
- Query Parameters
- Upload Metadata

---

# AI Standards

Provider:

```text
DeepSeek API
```

---

## Dedicated Prompts

Each AI feature must have its own prompt.

Examples:

```text
summaryPrompt
flashcardPrompt
quizPrompt
evaluationPrompt
reviewPrompt
```

Do not reuse one prompt for every feature.

---

# AI Review Rule

Critical Requirement:

AI must never automatically answer Study Room questions.

Correct Flow:

```text
Question
↓
Peer Answer
↓
Review Request
↓
AI Review
```

Incorrect Flow:

```text
Question
↓
AI Answer
```

This is prohibited.

---

# OCR Standards

Provider:

```text
Google Vision API
```

Flow:

```text
Image
↓
OCR
↓
Text
↓
DeepSeek
```

DeepSeek receives text.

Not images.

---

# Error Handling

Always handle errors gracefully.

---

## Upload Errors

Display:

```text
Upload failed.
Please try again.
```

---

## AI Errors

Display:

```text
Unable to generate content.
Please try again.
```

---

## Network Errors

Display:

```text
You appear to be offline.
```

---

# Loading States

Every async action must have:

- Loading State
- Success State
- Error State

---

# Offline Standards

Available Offline:

- Summaries
- Flashcards
- Quiz History
- Quiz Feedback
- Study Room History

---

Not Available Offline:

- AI Chat
- AI Reviews
- Quiz Generation
- Summary Generation

---

# Security Standards

## Never Expose

- DeepSeek API Key
- Firebase Admin Keys
- Google Vision API Keys

---

## Environment Variables

Store secrets in:

```env
.env.local
```

Never commit secrets to Git.

---

# Performance Standards

## Initial Load

Target:

```text
< 3 seconds
```

---

## Summary Generation

Target:

```text
< 15 seconds
```

---

## Quiz Generation

Target:

```text
< 15 seconds
```

---

## AI Review

Target:

```text
< 10 seconds
```

---

# Testing Standards

Test:

- Authentication
- Uploads
- Summary Generation
- Quiz Generation
- AI Reviews
- Offline Access

Before release.

---

# Documentation Standards

Every major feature must include:

- Purpose
- Inputs
- Outputs
- Error Cases

---

# Source Of Truth

Engineering decisions must align with:

1. PRD.pdf
2. AGENTS.md
3. ARCHITECTURE.md
4. DATABASE_DESIGN.md
5. AI_SPECIFICATION.md
6. USER_STORIES.md
7. DEVELOPMENT_ROADMAP.md
8. DESIGN_SYSTEM.md

If conflicts occur:

PRD.md takes precedence.