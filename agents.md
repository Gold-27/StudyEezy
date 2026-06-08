# AGENTS.md

# StudyEezy

Version: 1.0

Status: MVP

Platform: Mobile-First Responsive Web Application

---

# Project Overview

StudyEezy is an AI-powered collaborative learning and assessment platform.

The platform helps students:

- Upload study materials
- Generate summaries
- Generate flashcards
- Generate quizzes
- Study collaboratively
- Receive AI-reviewed feedback
- Continue learning offline

StudyEezy is NOT an AI chatbot.

StudyEezy's primary purpose is learning, assessment, revision, and collaboration.

AI serves as a learning assistant and evaluator.

---

# Product Vision

Help students learn actively rather than passively.

Encourage:

- Active Recall
- Peer Learning
- Knowledge Testing
- Assessment-Based Learning
- Revision
- Reflection

Discourage:

- Blind answer consumption
- Shortcut learning
- Passive dependence on AI

---

# Product Positioning

StudyEezy is:

- A collaborative learning platform
- An assessment platform
- A revision platform
- An AI-assisted learning platform

StudyEezy is NOT:

- A social network
- A learning marketplace
- An LMS
- A course-selling platform
- A ChatGPT clone

---

# Core Product Principle

The system should prioritize learning effectiveness over convenience.

Whenever a feature decision is required:

Choose the option that promotes learning.

Do NOT choose the option that merely provides answers faster.

---

# AI Philosophy

AI exists to support learning.

AI should encourage:

- Thinking
- Practice
- Reflection
- Improvement

AI should avoid:

- Replacing learning
- Providing unnecessary shortcuts

---

# Critical Rule: AI Review Mode

This is the primary differentiator of StudyEezy.

The AI must NEVER automatically answer questions inside Study Rooms.

### Correct Flow

Question

↓

Peer Answer

↓

AI Review Requested

↓

AI Evaluation

### Incorrect Flow

Question

↓

AI Immediately Answers

This behavior is forbidden.

---

# Mobile-First Requirement

The application is mobile-first.

Design Priority:

1. Mobile
2. Tablet
3. Desktop

All screens must be designed for mobile usage first.

Navigation must be optimized for touch devices.

---

# MVP Features

## Authentication

Supported:

- Sign Up
- Login
- Logout
- Password Reset
- Email Verification

### Rules

- Email verification is required.
- Users cannot access protected features until verified.

---

## Study Material Upload

### Supported File Types

- PDF
- DOC
- DOCX
- Images

### Supported Input Methods

- Upload
- Camera Capture

### Rules

- Images and captured documents must support OCR extraction.

---

## Voice Input

### Supported Areas

- AI Chat
- Study Rooms
- Quiz Answers
- Search

### Flow

Speech

↓

Speech-to-Text

↓

Text Input

---

## Summary Generation

Users must explicitly select a summary type.

The AI must never automatically choose a summary format.

### Supported Summary Types

- Short Summary
- Detailed Summary
- Revision Notes
- Key Concepts
- Exam Prep Summary

### Flow

Upload Material

↓

Select Summary Type

↓

Generate Summary

↓

Save Summary

↓

Offline Access

---

## Flashcards

### Generated From

- Uploaded Materials
- Generated Summaries
- Notes

### Supported Actions

- View
- Review
- Mark as Mastered

### Rules

- Flashcards must remain accessible offline.

---

## Quiz Generation

Users configure quizzes before generation.

### Question Types

- Multiple Choice
- Short Answer
- Theory
- Mixed

### Difficulty Levels

- Easy
- Medium
- Hard
- Mixed

### Question Counts

- 5
- 10
- 20
- 30
- Custom

---

# Quiz Rules

The system must NOT:

- Reveal answers during assessment
- Score during assessment
- Provide hints during assessment
- Reveal correct answers before submission

### Rule

All grading occurs after final submission.

---

# Quiz Evaluation

### Required Output

- Overall Score
- Grade
- Performance Breakdown
- Correct Answers
- Incorrect Answers
- Correct Solutions
- Missing Concepts
- Explanations
- Weak Topic Analysis
- Recommended Topics

---

# Retake Failed Questions

Users can retake only failed concepts.

### AI Requirements

Generate:

- Similar Questions
- Same Concept
- Different Wording

---

# AI Chat

### Purpose

Learning Support

### Supported Uses

- Concept Clarification
- Topic Simplification
- Examples
- Learning Assistance

### Rule

AI Chat requires internet access.

---

# Study Rooms

### Purpose

Collaborative Learning

Users can:

- Ask Questions
- Answer Questions
- Learn Together
- Request AI Reviews

---

# Study Room Roles

## Owner

### Permissions

- Create Room
- Delete Room
- Invite Members
- Remove Members
- Ask Questions
- Answer Questions
- Request AI Reviews
- View Room History

---

## Member

### Permissions

- Ask Questions
- Answer Questions
- Request AI Reviews
- View Room History

---

# AI Review Output

### Required Fields

- Score
- Strengths
- Missing Concepts
- Improvements
- Model Answer

### Rule

- AI reviews only after explicit request.
- AI must never review automatically.

---

# Offline Support

The application must support offline learning.

## Available Offline

- Generated Summaries
- Flashcards
- Uploaded Materials Already Synced
- Quiz History
- Quiz Feedback
- Quiz Corrections
- Previously Loaded Study Room History

## Not Available Offline

- AI Chat
- AI Reviews
- Summary Generation
- Quiz Generation
- OCR Processing
- Live Study Room Messaging

---

# Technology Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Next.js Server Actions

## Database

- Firebase Firestore

## Authentication

- Firebase Authentication

## Storage

- Firebase Storage

## Realtime

- Firestore Realtime Listeners

## AI

- DeepSeek API

## OCR

- Google Vision API

## Voice Input

- Web Speech API

## Offline

- Progressive Web App (PWA)
- IndexedDB
- Firestore Offline Persistence

## Deployment

- Vercel

---

# Non-Goals

The following features are out of scope for MVP:

- Video Calls
- Audio Calls
- Whiteboard Collaboration
- Teacher Accounts
- Course Marketplace
- Course Selling
- Subscription Billing
- Premium Plans
- Social Feed
- Native Mobile Apps

### Rule

Do not build these features unless explicitly requested in future versions.

---

# Development Rules

Always follow the PRD.

Do not invent features.

Do not expand scope.

Do not introduce functionality not documented in:

- PRD.pdf
- AGENTS.md
- Architecture Documents

### If Requirements Are Unclear

Prefer the simpler implementation.

### If A Feature Is Not Specified

Do not assume it exists.

### Always Maintain

- Mobile-first design
- Learning-first philosophy
- AI Review Mode
- Offline accessibility boundaries

These rules take precedence over assumptions.