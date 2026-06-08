# ARCHITECTURE.md

# StudyEezy Architecture

Version: 1.0

Status: MVP

Platform: Mobile-First Responsive Web Application

---

# Overview

This document defines the technical architecture for StudyEezy.

StudyEezy is an AI-powered collaborative learning and assessment platform that enables students to:

- Upload study materials
- Generate summaries
- Generate flashcards
- Generate quizzes
- Study collaboratively
- Receive AI-reviewed feedback
- Access previously generated content offline

The architecture prioritizes:

- Mobile-first experience
- Scalability
- Maintainability
- Offline accessibility
- Real-time collaboration

---

# Architecture Principles

## Mobile First

The application must be optimized for mobile devices first.

Priority:

1. Mobile
2. Tablet
3. Desktop

---

## Learning First

The architecture must support learning workflows rather than AI shortcut workflows.

The AI Review flow is a core architectural requirement.

---

## Offline First

Previously generated content should remain accessible without internet.

Offline accessibility is a core requirement.

---

## Simplicity Over Complexity

Prefer simple solutions over unnecessary abstractions.

Avoid premature optimization.

---

# Technology Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## Backend

Primary Pattern:

- Next.js Server Actions

Secondary Pattern:

- Route Handlers (only when necessary)

Expected Distribution:

- 80–90% Server Actions
- 10–20% Route Handlers

---

## Database

- Firebase Firestore

---

## Authentication

- Firebase Authentication

---

## Storage

- Firebase Storage

---

## Realtime

- Firestore Realtime Listeners

---

## AI

- DeepSeek API

---

## OCR

- Google Vision API

---

## Voice Input

- Web Speech API

---

## Offline

- Progressive Web App (PWA)
- Firestore Offline Persistence
- IndexedDB

---

## Deployment

- Vercel

---

# High-Level Architecture

```text
User

↓

Next.js Frontend

↓

Server Actions

↓

Business Logic Layer

↓

Firebase Services

├── Firestore
├── Firebase Storage
├── Firebase Authentication

↓

External Services

├── DeepSeek API
├── Google Vision API
```

---

# Application Layers

## Presentation Layer

Responsible For:

- UI Rendering
- User Interactions
- Forms
- Navigation
- Mobile Experience

Location:

```text
src/app
src/components
```

---

## Business Logic Layer

Responsible For:

- Validation
- Authorization
- Feature Logic
- AI Orchestration

Location:

```text
src/actions
src/services
```

---

## Data Layer

Responsible For:

- Firestore Access
- Storage Operations
- Offline Synchronization

Location:

```text
src/firebase
src/lib
```

---

# Recommended Folder Structure

```text
src

├── app
│
├── components
│
├── actions
│
├── services
│
├── hooks
│
├── lib
│
├── firebase
│
├── types
│
├── constants
│
├── validators
│
└── utils
```

---

# Feature-Based Structure

```text
src

├── features
│
├── auth
│
├── study-materials
│
├── summaries
│
├── flashcards
│
├── quizzes
│
├── study-rooms
│
├── ai-chat
│
└── offline
```

---

# Authentication Architecture

## Flow

```text
User

↓

Firebase Authentication

↓

Session Validation

↓

Protected Route

↓

Application Access
```

---

## Supported Features

- Sign Up
- Login
- Logout
- Email Verification
- Password Reset

---

# Study Material Architecture

## Supported Inputs

- PDF
- DOC
- DOCX
- Images
- Camera Capture

---

## Upload Flow

```text
User Upload

↓

Firebase Storage

↓

Metadata Saved

↓

Firestore
```

---

# OCR Architecture

Used For:

- Images
- Camera Captures

---

## OCR Flow

```text
Image

↓

Google Vision API

↓

Extracted Text

↓

Firestore

↓

Available For AI Processing
```

---

# Summary Generation Architecture

## Flow

```text
Study Material

↓

Summary Type Selected

↓

Server Action

↓

DeepSeek API

↓

Generated Summary

↓

Firestore

↓

Offline Cache
```

---

# Flashcard Architecture

## Flow

```text
Study Material

↓

DeepSeek API

↓

Flashcards

↓

Firestore

↓

Offline Cache
```

---

# Quiz Generation Architecture

## Flow

```text
Study Material

↓

Question Type

↓

Difficulty

↓

Question Count

↓

DeepSeek API

↓

Quiz Generated

↓

Firestore
```

---

# Quiz Evaluation Architecture

## Flow

```text
Quiz Submission

↓

Server Action

↓

DeepSeek Evaluation

↓

Score

↓

Feedback

↓

Weak Topic Analysis

↓

Firestore

↓

Offline Cache
```

---

# AI Chat Architecture

## Flow

```text
User Message

↓

Server Action

↓

DeepSeek API

↓

Response

↓

Firestore
```

---

## Requirements

AI Chat requires internet access.

No offline AI responses.

---

# Study Room Architecture

## Purpose

Collaborative Learning

---

## Room Flow

```text
Question

↓

Peer Answers

↓

AI Review Request

↓

AI Evaluation
```

---

# Critical Rule

AI must never automatically answer study room questions.

AI only participates when a review is requested.

---

# Realtime Messaging Architecture

```text
User Message

↓

Firestore

↓

Realtime Listener

↓

Connected Participants
```

---

# AI Review Architecture

## Flow

```text
Question

↓

Peer Answer

↓

Review Request

↓

DeepSeek Evaluation

↓

Review Response
```

---

## Review Output

Must Include:

- Score
- Strengths
- Missing Concepts
- Improvements
- Model Answer

---

# Voice Input Architecture

## Flow

```text
User Speech

↓

Web Speech API

↓

Text

↓

Input Field
```

---

## Supported Areas

- AI Chat
- Study Rooms
- Quiz Answers
- Search

---

# Offline Architecture

## Goal

Allow students to continue learning without internet.

---

## Available Offline

- Summaries
- Flashcards
- Quiz History
- Quiz Feedback
- Uploaded Materials
- Study Room History

---

## Offline Flow

```text
Firestore

↓

Local Persistence

↓

IndexedDB

↓

Offline Access
```

---

## Not Available Offline

- AI Chat
- AI Reviews
- OCR
- Summary Generation
- Quiz Generation
- Live Study Room Messaging

---

# Error Handling

## Upload Failures

Display:

- Upload Failed
- Retry Option

---

## OCR Failures

Display:

- Unable To Extract Text
- Retry Option

---

## AI Failures

Display:

- AI Service Unavailable
- Retry Option

---

## Network Failures

Display:

- Offline Indicator
- Cached Content Access

---

# Security Requirements

## Authentication

All protected routes require authentication.

---

## Authorization

Users can only access:

- Their own materials
- Their own quizzes
- Their own summaries

Except for Study Rooms they belong to.

---

## API Keys

Never expose:

- DeepSeek API Key
- Google Vision API Key
- Firebase Admin Credentials

Store all secrets in environment variables.

---

# Performance Goals

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

## Study Room Updates

Target:

```text
Near Real-Time
```

---

# Future Architecture Considerations

Out of Scope For MVP:

- Native Mobile Apps
- WebSockets
- Microservices
- Multi-Tenant Architecture
- Teacher Dashboards
- Subscription Billing
- Whiteboard Collaboration
- Video Calls
- Audio Calls

These may be introduced in future versions.

---

# Source Of Truth

Architecture decisions must align with:

1. PRD.pdf
2. AGENTS.md
3. DESIGN_SYSTEM.md

If conflicts occur:

PRD.md takes precedence.