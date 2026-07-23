# Task 01: Scaffolding

## Goal
A running Vite + React + TypeScript + Tailwind app that builds clean locally,
with the production base path already correct so nothing has to be rewired
when deployment is switched on at the end.

## What to build
- Vite project with React, TypeScript, Tailwind CSS, lucide-react, managed
  with pnpm (committed `pnpm-lock.yaml`).
- Vite `base` configured for the GitHub Pages subpath of the repository.
- A minimal placeholder screen proving Tailwind and the build both work.

## Why
Getting the base path right first avoids asset path surprises later, since the
data files will also be served as static assets under the same base.

The actual GitHub Pages deploy (workflow, Pages settings, first live URL) moved
to task 07, so the app is developed and validated locally against mock data and
only goes public once it is worth looking at.

## Notes
- File naming lowercase kebab-case everywhere, including `app.tsx`.
- No em dashes in any code, comments, or copy.
