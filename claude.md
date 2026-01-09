# Project Context (Claude)

## Goal

Short, high-signal context for AI assistance. This file is optimized to minimize token usage while preventing incorrect assumptions.

---

## Project Summary

- **Type:** Web application
- **Purpose:** Travel agency CRM, HotelRM, Quotes, Sales, Receipts, Financial data, Quote-to-sale workgflow, CMS, Users/Access Administration.
- **Users:** ~5 active users (low concurrency)
- **Stage:** early-stage, not yet commercial

---

## Tech Stack (Source of Truth)

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Backend / DB:** Supabase (PostgreSQL + RLS)
- **Hosting:** Vercel

Assume modern best practices. Do not introduce new frameworks unless explicitly asked.

---

## Backend Rules (Important)

- Supabase uses **Row Level Security (RLS)**
- All SQL must respect existing RLS policies
- Do NOT assume unrestricted access
- Prefer SQL that works with Supabase Postgres

---

## Database

- Schema is here supabase/schema.md
- Do not invent tables, columns, or relations
- Ask if schema context is missing
- If a request requires schema knowledge, you MUST ask to load schema.md before writing SQL

---

## Coding Preferences

- Prefer clarity over cleverness
- Avoid over-engineering
- Explicit > implicit
- Minimal abstractions

---

## What You Should Do

- Generate correct, production-safe code
- Explain tradeoffs briefly when relevant
- Flag risks (security, RLS, data integrity)

## What You Should NOT Do

- Do not hallucinate APIs or tables
- Do not ignore Supabase constraints
- Do not add unnecessary complexity

---

## Output Expectations

- Be concise
- Use Markdown
- Provide code blocks where applicable
- No filler, no motivational language
- Only save relevant data to context to avoid clutter

---

## When Unsure

Ask a short clarification question instead of guessing.
