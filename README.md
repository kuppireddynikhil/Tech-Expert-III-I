# TECH EXPERT 2K26 — AI-Powered Python Competition Platform

> **Flagship Python Competition Platform with Full Centralized Administrator Control**  
> **Sri Venkateswara College of Engineering (SVCE)**

---

## 🚀 Overview

**Tech Expert 2K26** is a comprehensive, production-ready, secure web application engineered for college branch fests at **Sri Venkateswara College of Engineering (SVCE)**. It delivers a multi-phase programming competition powered by server-side Google Gemini AI code interpretation, embedded Monaco Editor, authoritative timer engines, and deep administrative governance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, React Router 7, Monaco Editor (`@monaco-editor/react`), Lucide React |
| **Styling** | Vanilla CSS Cyber-Tech Design System, Glassmorphic Panels, Dynamic Glows, Responsive Typography |
| **Backend & Database** | Supabase Auth, PostgreSQL 15, Row Level Security (RLS), Supabase Edge Functions |
| **AI Evaluation** | Google Gemini API (`gemini-2.5-flash`), Structured JSON Schema, Untrusted Code Isolation |
| **Testing** | Vitest Test Suite (Unit, Integration, Security Boundaries) |

---

## 🏆 Three Competitive Phases

### 1. Phase 1 — Python Quick Quiz
- **Default Format**: 20 rapid-fire MCQs covering Python fundamentals (mutability, slicing, operators, dictionary hashability, generators, exception handling).
- **Authoritative Countdown**: 15 seconds per question default timer (or custom question-level override). Survives page refreshes.
- **Qualification Target**: Top 15 participants qualify for Phase 2.
- **Server-Side Scoring**: Evaluated securely on the server; correct answers are completely hidden from participants.

### 2. Phase 2 — Python Debugging Challenge
- **Default Format**: Up to 3 faulty starter programs with syntax, logical, or runtime errors.
- **Interface**: Full Monaco Editor with Python syntax highlighting and line numbers.
- **Phase Deadline**: 15 minutes overall phase limit with authoritative countdown.
- **AI Evaluation**: Mentally traced by Google Gemini AI with simulated console output clearly labeled as `[AI-Simulated Python Output]`.
- **Qualification Target**: Top 5 finalists advance to Phase 3.

### 3. Phase 3 — Python Logic Builder (Finals)
- **Default Format**: 3 complex algorithmic challenges for 5 finalists (free order).
- **Execution Policy**: Strictly maximum of **3 Run attempts per program**.
- **Permanent Lock**: After 3 unsuccessful attempts, the program is **permanently locked on the server**, disabling the editor and preventing further runs.
- **Completion**: 1st eligible finalist to solve all 3 programs wins; 2nd is runner-up.

---

## 🛡️ Central Administrator Control Center

Administrators govern the entire competition via `/admin/dashboard`:

- **Question Bank**: Create, edit, duplicate, archive (soft delete preserving history), and preview questions for all phases.
- **Question Sets**: Create unlimited question sets (Set A, Set B, Alternate), drag/reorder questions, assign default timers, and override timers per question.
- **Set Assignments**: Target sets to **Sections (A–E)**, **Academic Years (I–III)**, combinations (e.g. `A-I`), or specific participant UUIDs.
- **Phase Control**: Transition phases between `draft`, `scheduled`, `active`, `paused`, and `closed`.
- **Timer Hierarchy**: Visual inheritance resolver (`Question Override` &rarr; `Question Set Default` &rarr; `Phase Global Default`).
- **Participant Management**: Filter participants by Section A–E, Year I–III, and Status (`active`, `suspended`, `disqualified`).
- **Evaluation Review**: Inspect submitted code, original Gemini prompt/verdict, and perform **manual overrides with mandatory reasons**.
- **Leaderboard Certification**: Control public leaderboard visibility and certify the official Winner and Runner-up.
- **Audit Logs**: Immutable log recording administrator, action, target, summary, reason, and timestamp.

---

## 🔒 Security & Authorization

1. **Role Separation**: Administrator privileges are verified server-side in `admin_roles`. Non-admin participants cannot access administrative routes or RPCs.
2. **Untrusted Code Isolation**: Participant code is analyzed by Gemini as untrusted text data and is **never executed directly on the host server**.
3. **Database RLS**: Participant queries use views (`participant_questions_view`) that omit private correct answers, rubrics, and reference solutions.
4. **Attempt Atomicity**: Attempt counters and locks in `program_attempts` are enforced using PostgreSQL atomic updates.
5. **Initial Bootstrap Credentials**:
   - Initial Admin Email: `svce.techexpert.2K26@gmail.com`
   - Initial Bootstrap Password: `aim2k26tepy` (supplied via secure provisioning, never committed to version control).
   - The platform strictly enforces a **mandatory password change** upon first login, invalidating the bootstrap credential.

---

## 📦 Setup & Local Development

### 1. Prerequisites
- Node.js v20+ or v22+
- npm v10+ or v11+
- Supabase account (free-tier supported)
- Google AI Studio API Key (`GEMINI_API_KEY`)

### 2. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Backend & Admin Provisioning (Secret)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ADMIN_INITIAL_EMAIL=svce.techexpert.2K26@gmail.com
ADMIN_INITIAL_PASSWORD=aim2k26tepy
```

### 3. Run Database Migrations
Execute the migrations in your Supabase SQL Editor in numerical order:
1. `supabase/migrations/20261018000000_tech_expert_schema.sql` (Tables, RLS policies, trigger)
2. `supabase/migrations/20261018000001_seed_questions.sql` (20 MCQs, 3 Debugging, 3 Logic programs, sets)
3. `supabase/migrations/20261018000002_admin_bootstrap_and_rpcs.sql` (Authoritative RPCs, locking engine)

### 4. Provision Initial Administrator
Run the secure provisioning script:
```bash
node scripts/provision-admin.js
```

### 5. Start Application Locally
```bash
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 6. Run Test Suite
```bash
npm test
```
Runs all 11 unit, integration, and security authorization tests.

---

## 🌐 Deploying to Production

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Push project to your GitHub repository (ensure `.env` is ignored by `.gitignore`).
2. Connect repository to your hosting provider.
3. Configure Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Set Build Command: `npm run build`
5. Set Output Directory: `dist`

### Supabase Edge Functions Deployment
Deploy the edge functions using Supabase CLI:
```bash
supabase functions deploy ai-evaluate --no-verify-jwt
supabase functions deploy submit-run
supabase secrets set GEMINI_API_KEY=your_google_ai_studio_key
```

---

## 🏛️ Event Organization
- **Host Institution**: Sri Venkateswara College of Engineering (SVCE)
- **Event**: Tech Expert 2K26 College Branch Fest
- **Participating Branches**: Sections A, B, C, D, E | Academic Years I, II, III
