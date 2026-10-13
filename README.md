# Todo App with Authentication

A React + TypeScript single-page app where a user can sign up, verify their email, log in, recover a forgotten password, and manage their own todos. It talks to a mock API (MSW) that follows the contract the future NestJS backend will implement.

> **Status:** work in progress. The full README (setup, test accounts, architecture, decisions) is written in Phase 8 of the project plan.

## Documents

- [Project plan](Todo-App-Project-Plan.md): requirements, architecture and build plan
- [Decision log](Todo-App-Project-Plan.md#2-decision-log): key decisions and trade-offs
- [API contract](docs/api-contract.md): the contract shared by the mock and the backend

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Run `npm run check` (lint, type-check, format check, tests, build) before every push.
