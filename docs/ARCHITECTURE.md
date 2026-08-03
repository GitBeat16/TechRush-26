# TechRush-26 Architecture Guide

## Overview

TechRush-26 is a Next.js + TypeScript application.

The project follows a feature-based architecture to keep development clean and allow multiple team members to work independently.

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS

## Backend
- Supabase

## Authentication
- Supabase Auth
- Google OAuth

## Database
- Supabase PostgreSQL

---

# Folder Structure

## app/

Contains:
- Pages
- Routes
- Layouts

Example:

app/login/page.tsx


---

## components/

Contains reusable UI components.

Examples:

- Buttons
- Cards
- Navbar
- Modals

Components should be reusable and not contain business logic.


---

## lib/

Contains external services and configurations.

Example:

lib/
 └── supabase/

      client.ts
      auth.ts
      database.ts


All Supabase-related logic must stay here.


---

## types/

Contains TypeScript interfaces and types.

Example:

User
Profile
Preferences


---

# Feature Development Rules

Each major feature should have its own folder.

Example:

features/

 ├── auth

 ├── preferences

 └── dashboard


---

# Authentication Flow

Google Login

↓

Supabase Authentication

↓

Create User Profile

↓

Collect User Preferences

↓

Generate Personalized Dashboard


---

# Environment Variables

Never commit:

.env
.env.local


Use:

.env.example


---

# Git Rules

Branches:

feature/<feature-name>


Examples:

feature/supabase-auth

feature/dashboard


Never directly push to main.

---

# AI Development Rules

Before generating code using AI:

1. Read this file.
2. Follow existing folder structure.
3. Do not create duplicate components.
4. Reuse existing utilities.
5. Ask before adding new dependencies.