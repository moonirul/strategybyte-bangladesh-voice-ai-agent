# Voice Provider Architecture & Vapi Integration Guide

## 1. Provider Abstraction (`VoiceProvider`)

The frontend call experience (`frontend/src/components/voice/VoiceCallModal.tsx`) never imports a vendor SDK directly. Instead, it depends on the provider-independent contract in [`frontend/src/providers/voice/types.ts`](../frontend/src/providers/voice/types.ts):

- `startCall(): Promise<void>`
- `endCall(): Promise<void>`
- `setMuted(muted: boolean): void`
- `getStatus(): VoiceCallStatus`
- `subscribeToEvents(listener: VoiceEventListener): () => void`

Typed lifecycle events:
- `call.initiated` (`providerCallId`, `provider`, `callMode`, `at`)
- `connection.changed` (`idle` | `connecting` | `active` | `ending` | `ended` | `error`)
- `transcript.message` (`sequenceNumber`, `speaker`, `text`, `timestampMs`, `isFinal`)
- `speaker.changed` (`assistant` | `caller` | `null`)
- `call.ended` (`caller_ended` | `assistant_ended` | `error`)
- `provider.error` (`code`, `message`, `retryable`)
- `call.final_data` (structured extraction payload)

### How This Supports Future LiveKit or Pipecat Adapters
Because the UI and backend persistence contracts depend only on `VoiceProvider` and `VoiceEvent`:
- A **LiveKit** adapter can connect to a `Room`, map `RoomEvent.ConnectionStateChanged` to `connection.changed`, map data-channel/transcription segments to `transcript.message`, and toggle the local microphone track in `setMuted()`.
- A **Pipecat** (`RTVIClient`) adapter can map RTVI bot/user transcription callbacks into `transcript.message` and bot-speaking events into `speaker.changed`.
Neither the landing page, call modal, database schema, nor staff portal need to be rewritten.

---

## 2. Step-by-Step Vapi Integration Guide (Priority 3)

When you are ready to connect a live Vapi voice assistant, follow these 10 steps:

### Step 1: Create the Assistant in Vapi
1. Sign in to the Vapi Dashboard and create a new Assistant named **`ByteVoice — Dhaka Dental Care (Bangla)`**.
2. Copy the **Assistant ID** and your account's **Public Key** (for the browser) and **Server Webhook Secret** (for FastAPI).

### Step 2: Configure Bangla System Prompt & Clinic Knowledge
Use a strict clinical receptionist prompt that forbids medical advice and false booking confirmations:
```text
You are the Bangla digital receptionist for Dhaka Dental Care (ঢাকা ডেন্টাল কেয়ার).
Always speak naturally and politely in Bangla (or Bangla-English if the caller speaks English).
Opening hours: শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। শুক্রবার বন্ধ।
Doctors:
- ডা. ফারজানা হক (Dr. Farzana Haque) — General dentistry
- ডা. ইমরান কবির (Dr. Imran Kabir) — Orthodontics

Rules:
1. If the caller wants an appointment, collect:
   - Reason for visit (সমস্যা)
   - Full name (পুরো নাম)
   - 11-digit Bangladeshi mobile number starting with 01 (মোবাইল নম্বর)
   - Preferred day and time (দিন ও সময় — ask whether morning/afternoon/evening if ambiguous)
   - Preferred doctor (optional)
2. Read back the details to confirm with the caller.
3. Explicitly state that this is an appointment REQUEST (অনুরোধ) and clinic staff will confirm the final slot. Never claim a slot is already confirmed.
4. If the caller asks a medical question or fee question outside your approved knowledge, do not guess—collect their name and phone number for a human staff callback.
```

### Step 3: Speech, Transcriber & Language Settings
- **Transcriber (STT)**: Select a model with Bengali (`bn` / `bn-BD`) support (e.g., Deepgram Nova-2/Nova-3 or Azure STT `bn-BD`) so Bangla script and numerals are transcribed accurately.
- **Voice (TTS)**: Select a Bangla-capable neural voice (`bn-BD`) and keep speaking rate natural (`0.95–1.0`).
- **Analysis / Structured Data**: Configure Vapi's post-call Structured Data schema to extract `intent`, `reasonForVisit`, `patientName`, `patientNameConfirmed`, `phoneRaw`, `phoneConfirmed`, `preferredDateText`, `preferredDoctor`, `bookingStatus` (`"none"` or `"requested"`), `requiresHumanFollowup`, and `followupReason`.

### Step 4: Browser Microphone Permissions & Environment Variables
Set the public variables in `frontend/.env.local` (never put private keys in `NEXT_PUBLIC_*`):
```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-vapi-assistant-id
```
The browser will prompt for microphone access (`navigator.mediaDevices.getUserMedia({ audio: true })`) when `startCall()` is invoked over HTTPS or `http://localhost`.

### Step 5: Connect the Official Vapi Web SDK
Install the official web package in `frontend/`:
```bash
npm install @vapi-ai/web
```
Then update [`frontend/src/providers/voice/vapi-provider.ts`](../frontend/src/providers/voice/vapi-provider.ts) after verifying the installed SDK's method signatures.

### Step 6: Map Vapi Events to `VoiceEvent`
Inside `VapiVoiceProvider`:
- `call-start` → emit `call.initiated` (`callMode: "live"`, `provider: "vapi"`) and `connection.changed` (`"active"`).
- `speech-start` / `speech-end` → emit `speaker.changed`.
- `message` (`type === "transcript"`) → emit `transcript.message` with `isFinal: message.transcriptType === "final"`.
- `call-end` → emit `call.ended` and `connection.changed` (`"ended"`).
- `error` → emit `provider.error`.

### Step 7: Send Final Call Results to FastAPI
Configure your Vapi Assistant's **Server URL** to point to your deployed FastAPI webhook endpoint:
```text
https://<your-backend-domain>/api/webhooks/vapi
```

### Step 8: Secure Webhook Delivery
Set `VAPI_WEBHOOK_SECRET` in `backend/.env` and configure Vapi to send the matching secret in the `X-Vapi-Secret` header. `verify_vapi_webhook_secret` in [`backend/app/integrations/vapi/webhook.py`](../backend/app/integrations/vapi/webhook.py) validates this secret using constant-time `hmac.compare_digest`.

### Step 9: Test Real Call Status, Transcript Accuracy & Persistence
1. Initiate a live call from the modal after switching to **Live Vapi**.
2. Speak a Bangla appointment request and end the call.
3. Verify that `POST /api/webhooks/vapi` returns `200 OK`, normalises the phone number via `validate_bd_phone`, parses the date/time preference via `parse_spoken_preference`, and persists the record with `call_mode = "live"`.

### Step 10: Known Provider Limitations & Manual Configuration
- **Bangla STT code-switching**: Callers mixing Bangla and English medical terms ("root canal", "scaling") may occasionally produce transliterated Bangla or Latin words; our schema preserves the original transcript (`text_bn`) and spoken date preference (`preferred_date_text`) so staff always see the exact context.
- **No direct calendar slot lock during call**: Until a real-time clinic calendar integration is added, all voice bookings are recorded as `requested` and confirmed by staff in the portal.
