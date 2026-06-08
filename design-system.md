# DESIGN_SYSTEM.md

# StudyEezy Design System

Version: 1.0

Status: MVP

Platform: Mobile-First Responsive Web Application

---

# Overview

This document defines the visual foundation of StudyEezy.

The design system exists to ensure consistency across the product while maintaining a clean, educational, and distraction-free user experience.

The current design system consists of:

- Color Tokens
- Typography Tokens
- Spacing Tokens
- Radius Tokens
- Shadow Effects

Component libraries are not part of the current design system and should evolve organically during product development.

---

# Design Philosophy

StudyEezy is a learning-focused platform.

The interface should feel:

- Clean
- Modern
- Trustworthy
- Focused
- Accessible

The UI must prioritize learning content over decorative elements.

---

# Mobile-First Principle

StudyEezy is designed mobile-first.

Design Priority:

1. Mobile
2. Tablet
3. Desktop

All layouts, spacing decisions, and interactions must be optimized for touch devices before desktop experiences are considered.

---

# Design Token Architecture

The design system uses a token-based workflow.

Source of Truth:

Figma Variables

↓

tokens.json

↓

design-tokens.css

↓

Application UI

---

# Token Rules

Developers must consume design tokens directly from the exported token system.

Do NOT hardcode:

- Colors
- Typography Values
- Spacing Values
- Radius Values

All visual styling should reference exported design tokens whenever possible.

---

# Color System

## Source Of Truth

Color values are managed in:

Figma Variables

↓

tokens.json

↓

design-tokens.css

---

## Color Roles

The design system contains semantic color roles.

Available roles include:

- Primary
- On Primary
- Primary Container
- On Primary Container

- Secondary
- On Secondary
- Secondary Container
- On Secondary Container

- Tertiary
- On Tertiary
- Tertiary Container
- On Tertiary Container

- Accent

- Neutral
- Neutral Variant

- Surface
- Surface Variant

- Background

- Error
- On Error

---

## Color Rules

Do not reference raw color values directly.

Preferred:

```text
Primary
```

Avoid:

```text
#4F46E5
```

Always use semantic color roles.

---

# Typography

## Font Family

Primary Font:

```text
Outfit
```

Fallback:

```css
sans-serif
```

---

## Typography Source Of Truth

Typography values are managed in:

Figma Variables

↓

tokens.json

↓

design-tokens.css

---

## Typography Rules

Developers must consume typography tokens.

Do not hardcode:

- Font Sizes
- Font Weights
- Line Heights
- Letter Spacing

---

## Typography Hierarchy

### Display

Used For:

- Hero Headlines
- Marketing Headlines

---

### Headline

Used For:

- Page Titles
- Major Section Titles

---

### Title

Used For:

- Card Titles
- Content Headers

---

### Body

Used For:

- Study Materials
- Notes
- Summaries
- Quiz Content
- AI Feedback

---

### Label

Used For:

- Buttons
- Inputs
- Navigation
- Interactive Elements

---

# Spacing System

## Source Of Truth

Spacing values are managed through Figma Variables and exported through the token system.

---

## Spacing Tokens

| Token | Value |
|---------|---------|
| space-0 | 0 |
| space-1 | 4 |
| space-2 | 8 |
| space-3 | 12 |
| space-4 | 16 |
| space-5 | 24 |
| space-6 | 32 |
| space-7 | 40 |
| space-8 | 48 |
| space-9 | 64 |
| space-10 | 80 |
| space-11 | 96 |

---

## Spacing Guidelines

Most commonly used spacing values:

- 8
- 16
- 24
- 32
- 48

Use these values whenever possible for consistency.

---

# Radius System

## Source Of Truth

Radius values are managed through Figma Variables and exported through the token system.

---

## Radius Tokens

| Token | Value |
|---------|---------|
| radius-none | 0 |
| radius-xs | 4 |
| radius-sm | 8 |
| radius-md | 12 |
| radius-lg | 16 |
| radius-xl | 24 |
| radius-full | 9999 |

---

## Radius Guidelines

### Inputs

Use:

```text
radius-md
```

---

### Buttons

Use:

```text
radius-md
```

---

### Cards

Use:

```text
radius-lg
```

---

### Pills / Tags

Use:

```text
radius-full
```

---

# Effects

Effects are documented and maintained within the Figma Effects page.

---

# Shadow System

The MVP design system includes three shadow levels.

---

## Shadow/1

Purpose:

Subtle elevation

Recommended Usage:

- Cards
- Inputs
- Flashcards

Characteristics:

- Light
- Minimal depth
- Everyday UI surfaces

---

## Shadow/2

Purpose:

Interactive elevation

Recommended Usage:

- Hover States
- Interactive Cards
- Dropdown Menus

Characteristics:

- Noticeable depth
- Interactive feedback

---

## Shadow/3

Purpose:

High elevation

Recommended Usage:

- Modals
- Dialogs
- Overlays

Characteristics:

- Strong depth
- Highest visual prominence

---

# Accessibility

The design system must prioritize readability and usability.

Requirements:

- Maintain sufficient color contrast
- Use semantic colors
- Ensure text remains readable across screen sizes
- Support touch-first interactions
- Avoid excessively small touch targets

---

# Current Scope

The current design system includes:

- Color Tokens
- Typography Tokens
- Spacing Tokens
- Radius Tokens
- Shadow Effects

---

# Out Of Scope

The following systems are not yet defined:

- Component Library
- Motion System
- Animation Tokens
- Elevation Tokens
- Dark Mode
- Illustration Guidelines
- Iconography Guidelines

These may be introduced in future versions.

---

# Source Of Truth

When conflicts occur, use the following priority order:

1. Figma Variables
2. tokens.json
3. design-tokens.css
4. Application Implementation

The design token system is the authoritative source for all visual decisions.