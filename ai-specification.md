# AI_SPECIFICATION.md

# StudyEezy AI Specification

Version: 1.0

Status: MVP

AI Provider: DeepSeek API

---

# Overview

This document defines all AI behavior within StudyEezy.

The AI system exists to support learning.

The AI system must not encourage passive learning.

StudyEezy is not an AI chatbot.

StudyEezy is an AI-powered learning and assessment platform.

---

# AI Philosophy

The AI should function primarily as:

- Evaluator
- Learning Assistant
- Quiz Generator
- Summary Generator
- Feedback Provider

The AI should not function primarily as:

- Answer Machine
- Homework Completion Tool
- Shortcut Tool

---

# Core Principle

The AI must promote learning.

When multiple responses are possible:

Prefer the response that improves understanding.

Do not optimize for speed at the expense of learning.

---

# AI Features

The AI system supports:

- Summary Generation
- Flashcard Generation
- Quiz Generation
- Quiz Evaluation
- AI Chat
- AI Review Mode
- Weak Topic Analysis
- Study Recommendations

---

# AI Review Mode

## Purpose

AI Review Mode is the primary differentiator of StudyEezy.

The AI acts as an evaluator.

The AI does not participate until requested.

---

## Correct Flow

Question

↓

Peer Answer

↓

Review Requested

↓

AI Evaluation

---

## Forbidden Flow

Question

↓

AI Immediately Answers

This behavior is prohibited.

---

# AI Review Output

Every review must include:

## Score

Example:

```text
7/10
```

---

## Strengths

Identify correct concepts.

Example:

```text
✓ Correctly explained photosynthesis
✓ Mentioned sunlight
```

---

## Missing Concepts

Identify omitted information.

Example:

```text
✗ Carbon dioxide
✗ Water
✗ Glucose
```

---

## Improvements

Suggest ways to improve the answer.

---

## Model Answer

Provide a complete ideal answer.

---

# Summary Generation

## Purpose

Transform learning materials into structured study resources.

---

## Input

Supported Sources:

- PDF
- DOC
- DOCX
- Images
- OCR Text

---

## User Selected Summary Types

The user must choose a summary type.

The AI must not choose automatically.

---

### Short Summary

Goal:

Quick overview

Characteristics:

- Concise
- Easy to skim

---

### Detailed Summary

Goal:

Deep understanding

Characteristics:

- Comprehensive
- Full concept coverage

---

### Revision Notes

Goal:

Exam preparation

Characteristics:

- Bullet points
- Quick review format

---

### Key Concepts

Goal:

Concept mastery

Characteristics:

- Definitions
- Principles
- Formulas

---

### Exam Prep Summary

Goal:

High-yield revision

Characteristics:

- Frequently tested concepts
- Important facts

---

# Flashcard Generation

## Purpose

Create active recall learning materials.

---

## Flashcard Structure

Front:

Question

Back:

Answer

---

## Rules

Questions should encourage recall.

Avoid simple copy-paste extraction.

---

# Quiz Generation

## Purpose

Create assessment experiences.

---

## User Configuration

### Question Type

Options:

- Multiple Choice
- Short Answer
- Theory
- Mixed

---

### Difficulty

Options:

- Easy
- Medium
- Hard
- Mixed

---

### Question Count

Options:

- 5
- 10
- 20
- 30
- Custom

---

## Quiz Rules

The AI must generate questions based on:

- Uploaded Material
- Generated Summary
- OCR Text

The AI must not generate unrelated questions.

---

# Quiz Evaluation

## Trigger

Occurs only after final submission.

---

## Forbidden Behaviors

The AI must not:

- Reveal answers during assessment
- Reveal hints during assessment
- Score during assessment

---

## Required Output

### Overall Score

Example:

```text
18/25
72%
Grade B
```

---

### Performance Breakdown

By question type.

---

### Correct Answers

Display all correct responses.

---

### Incorrect Answers

Display:

- Question
- User Answer
- Correct Answer
- Explanation

---

### Weak Topic Analysis

Identify:

- Weak Concepts
- Knowledge Gaps

---

### Study Recommendations

Recommend:

- Topics To Review
- Areas Requiring Improvement

---

# Retake Failed Questions

## Purpose

Reinforce weak concepts.

---

## Rules

Generate:

- Similar Questions
- Same Concept
- Different Wording

Do not repeat the exact question.

---

# AI Chat

## Purpose

Learning Assistance

---

## Supported Requests

- Explain Concepts
- Simplify Topics
- Give Examples
- Clarify Confusing Material

---

## Response Style

Responses should be:

- Educational
- Clear
- Concise
- Encouraging

---

## Avoid

- Excessive verbosity
- Unnecessary jargon
- Overly academic language

---

# Weak Topic Analysis

## Purpose

Identify learning gaps.

---

## Sources

Based On:

- Quiz Results
- AI Reviews
- Repeated Mistakes

---

## Output

Example:

```text
Weak Areas:

- Photosynthesis
- Cell Division
- Genetics
```

---

# Study Recommendations

## Purpose

Guide students toward improvement.

---

## Output Example

```text
Recommended Topics:

1. Photosynthesis
2. Mitosis
3. DNA Replication
```

---

# Voice Input

Voice input uses:

```text
Web Speech API
```

The AI receives text after transcription.

The AI never receives raw audio.

---

# OCR Processing

OCR uses:

```text
Google Vision API
```

The AI receives extracted text only.

The AI never processes images directly.

---

# Prompt Engineering Rules

Every AI feature should use dedicated prompts.

Do not reuse one prompt for all features.

Examples:

- Summary Prompt
- Flashcard Prompt
- Quiz Prompt
- Evaluation Prompt
- AI Review Prompt

Each prompt should be optimized for its specific task.

---

# Error Handling

If AI generation fails:

Display:

```text
Unable to generate content.

Please try again.
```

Provide retry functionality.

---

# Performance Targets

Summary Generation:

```text
< 15 seconds
```

Quiz Generation:

```text
< 15 seconds
```

AI Review:

```text
< 10 seconds
```

AI Chat Response:

```text
< 8 seconds
```

---

# Future AI Features

Out of Scope For MVP:

- Voice Conversations
- AI Tutors
- Personalized Learning Paths
- Adaptive Learning Systems
- AI Study Plans
- AI Classrooms
- AI Teacher Accounts

These may be considered in future versions.

---

# Source Of Truth

This document must remain aligned with:

1. PRD.pdf
2. AGENTS.md
3. ARCHITECTURE.md
4. DATABASE_DESIGN.md

If conflicts occur:

PRD.md takes precedence.