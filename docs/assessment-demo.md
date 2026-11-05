# English Technical Walkthrough & 3-Minute Demo Script

Use this guide to practise and deliver a clear, honest technical walkthrough during your live practical assessment and interview with Australian engineering leadership.

---

## Part 1: 10-Point Technical Walkthrough (Interview Guide)

### 1. The Problem Being Solved
"Clinics and diagnostic centres in Bangladesh receive a high volume of phone calls for routine questions—like opening hours or doctor availability—and appointment serial requests. Reception staff get overwhelmed, calls go unanswered during peak hours, and patient details written on paper get lost. ByteVoice Bangladesh answers patient calls in natural Bangla, collects structured appointment requests or callback needs, validates Bangladeshi phone numbers, and organises every interaction in a clinic staff portal."

### 2. Why the Hero and 3D Experience Were Designed This Way
"The landing page uses a dark navy, off-white, and clinical teal palette with `Hind Siliguri` for crisp Bengali typography. For the hero, I built an acoustic orb and concentric waveform rings in React Three Fiber. Importantly, I treated the 3D scene as disciplined product engineering rather than a heavy tech demo: all headings and CTAs remain accessible HTML, `pointer-events: none` ensures the canvas never blocks clicks, `IntersectionObserver` pauses the WebGL render loop when scrolled off-screen, `prefers-reduced-motion` freezes motion for accessibility, and if WebGL isn't available on a low-end device, it falls back cleanly to a lightweight CSS illustration. It is also explicitly labelled as a decorative voice field rather than pretending to react to live microphone audio when idle."

### 3. How Frontend and Backend Responsibilities Are Separated
"The project is a monorepo with `frontend/` in Next.js 16 (App Router, TypeScript strict mode, Tailwind v4, TanStack Query, React Hook Form + Zod) and `backend/` in Python FastAPI with Pydantic v2. Next.js handles UI rendering, the 3D scene, the voice call interface, and Supabase Auth sessions. FastAPI owns all business logic, Bangla data validation, call-lifecycle persistence, and webhook ingestion. I intentionally avoided adding Prisma inside Next.js because having two ORMs across TypeScript and Python creates schema drift; instead, PostgreSQL migrations in `backend/migrations` are the single source of truth and FastAPI owns all database operations."

### 4. How Supabase Tables Relate to One Another
"All clinical data is anchored to `clinics`. Staff accounts in `auth.users` map 1-to-1 to `profiles`, which binds each user to a `clinic_id` and role (`admin`, `staff`, or `viewer`). When a call arrives, a row is created in `calls` linked to `clinics` and optionally `patients`. Each call has ordered `transcript_turns` (`UNIQUE (call_id, sequence_number)`), a 1-to-1 `call_extractions` record storing both the caller's original spoken preference (`preferred_date_text`) and parsed dates/times, an optional unconfirmed `appointments` request, and an optional `follow_up_requests` row when human escalation is needed."

### 5. How Authentication and Clinic-Level Access Work
"Staff sign in with Supabase Auth. When the frontend calls FastAPI, it sends the Bearer JWT. In FastAPI, `get_current_profile` verifies the token signature and looks up the user's `clinic_id` from `profiles`. The backend never trusts a client-supplied `clinic_id`. Every repository query scopes by that server-resolved `clinic_id`, and PostgreSQL Row-Level Security policies enforce the same boundary in Supabase using `public.current_user_clinic_id()`."

### 6. How Call Data Moves from Ingestion to the Portal
"When a visitor starts a demo call on the landing page, `POST /api/demo-calls` creates an `in_progress` call record scoped to Dhaka Dental Care and returns an HMAC-SHA256 signed `X-Demo-Call-Token`. As turns occur, `POST /api/demo-calls/{id}/turns` upserts each turn by sequence number. When the call ends, `POST /api/demo-calls/{id}/finish` runs `CallLifecycleService.complete_call()`: it validates the patient's Bangla name and phone number, matches or creates the patient record, records an appointment with `status = 'requested'`, creates a follow-up if anything was ambiguous, and marks the call completed. Staff then log into `/portal` to review the transcript, confirm the appointment slot, or resolve the follow-up."

### 7. How Bangla Phone Numbers and Dates Are Validated
"In `backend/app/core/validation.py`, `to_ascii_digits` converts Bangla numerals (`০-৯`) to ASCII (`0-9`) before validation. `validate_bd_phone` strips formatting characters, checks for valid Bangladeshi prefixes (`013`–`019`) and exact 11-digit national length, and normalises valid numbers to E.164 (`+8801XXXXXXXXX`). If a number is malformed or incomplete, we never guess digits—we reject it and flag the call for human follow-up. Similarly, `parse_spoken_preference` resolves relative Bangla days (`আজ`, `আগামীকাল`, `পরশু`) and part-of-day markers (`সকাল`, `দুপুর`, `বিকাল`, `সন্ধ্যা`, `রাত`) in `Asia/Dhaka`. If someone says `'কাল ৫টা'` without specifying morning or afternoon, the parser flags `ambiguous_time`, keeps `preferred_datetime` as `NULL`, preserves `'কাল ৫টা'` in `preferred_date_text`, and opens a follow-up request."

### 8. How Provider Abstraction Enables Future Vapi Integration
"The call modal only talks to the `VoiceProvider` interface (`startCall`, `endCall`, `setMuted`, `getStatus`, `subscribeToEvents`). Right now, `DemoVoiceProvider` runs a deterministic Bangla conversation in the browser with zero external credentials. When we connect Vapi, we implement `VapiVoiceProvider` to map Vapi Web SDK events to our `VoiceEvent` union, and point Vapi's server webhook to `POST /api/webhooks/vapi`. The UI, database schema, and staff portal stay completely unchanged."

### 9. How Duplicate Events and Partial Failures Are Handled
"Call creation is idempotent on `(clinic_id, provider, provider_call_id)`, and transcript turns are idempotent on `(call_id, sequence_number)`. If a network retry resends the same turn batch or webhook payload, existing records are updated in place rather than duplicated. On the frontend, `apiRequest` enforces request timeouts via `AbortController` and classifies errors into retryable (`5xx`, `429`, network) vs non-retryable (`4xx`) so TanStack Query doesn't hammer the server on validation or auth errors."

### 10. What Remains Incomplete and Why
"By design, live Vapi voice streaming is left as a documented adapter placeholder (`vapi-provider.ts` and `/api/webhooks/vapi`) so the core frontend, backend, Bangla validation, and portal workflows could be built and verified first without external paid voice credentials. Outbound reminder calls/SMS and real-time doctor calendar slot locking are also clearly marked as future integrations."

---

## Part 2: Three-Minute Demo Video Script

### 0:00 – 0:35 · Landing Page & Three.js Hero
- **Screen**: Open `http://localhost:3000`.
- **Voiceover**: "Hi, this is my ByteVoice Bangladesh submission for the StrategyByte AI Engineer assessment. We're looking at the public product site for our demo clinic, Dhaka Dental Care. In the hero, we have our English and Bangla value proposition alongside a React Three Fiber 3D voice field. The 3D scene is built for production: it pauses when off-screen, respects `prefers-reduced-motion`, and falls back to CSS if WebGL is unavailable. As you scroll, the page outlines the 3-step call lifecycle, implemented product capabilities, and healthcare use cases across Bangladesh."

### 0:35 – 1:30 · Simulated Bangla Call Journey
- **Screen**: Click **"Talk to our Bangla caller"** in the hero. Click **"Start Bangla Demo Call"** in the modal.
- **Voiceover**: "Clicking the primary CTA opens the in-app call interface powered by our `VoiceProvider` abstraction. It's clearly labelled as a Simulated Demo. The receptionist greets us in Bangla for Dhaka Dental Care. Let's request an appointment (`আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই`), specify tooth pain (`দাঁতে ব্যথা হচ্ছে`), enter a Bangla name (`রহিম উদ্দিন`), and enter a phone number using Bangla digits (`০১৭১২৩৪৫৬৭৮`). Next, I'll select a preferred time (`আগামীকাল বিকাল ৫টায়`), choose `ডা. ফারজানা হক`, and confirm the read-back (`হ্যাঁ, ঠিক আছে`). Notice the assistant explicitly tells the patient this is an appointment *request* and staff will confirm the final time."

### 1:30 – 2:25 · Persisted Call Record, Portal & Transcript
- **Screen**: Review the generated Structured Call Record card inside the modal, then click **"Inspect in Staff Portal"**.
- **Voiceover**: "As soon as the call finishes, the structured extraction summary appears and is persisted to our FastAPI backend. Clicking 'Inspect in Staff Portal' takes us into the clinic portal. On the Dashboard, we see total calls, demo vs live activity,appointment requests, and pending follow-ups. Opening the Call Detail page shows the patient's E.164 normalised number (`+8801712345678`), the original spoken preference (`আগামীকাল বিকাল ৫টায়`) alongside the parsed `Asia/Dhaka` date and `17:00` time, the `Requested (unconfirmed)` booking state, and the full sequenced Bangla transcript with timestamps. In the Appointments view, reception staff can assign a verified slot and confirm the booking, which generates a booking reference."

### 2:25 – 3:00 · Architecture & Engineering Highlights
- **Screen**: Open ` Settings & Status` in the portal, then briefly show `backend/app/core/validation.py` and `frontend/src/providers/voice/types.ts`.
- **Voiceover**: "Under the hood, Next.js communicates with FastAPI over typed contracts. Clinic access is derived strictly from the authenticated user's server-side profile and enforced with PostgreSQL Row-Level Security. Our Bangla validation layer normalises Bangla digits without ever guessing uncertain numbers or ambiguous times, and our `VoiceProvider` interface lets us plug in the live Vapi SDK and `/api/webhooks/vapi` without changing the UI or database schema. Thanks for watching."
