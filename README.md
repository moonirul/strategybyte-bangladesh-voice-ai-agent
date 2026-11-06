# ByteVoice Bangladesh 🇧🇩🤖

> **An enterprise-grade, AI-powered voice receptionist system tailored for healthcare facilities in Bangladesh, designed to handle patient inquiries, appointments, and follow-ups through natural Bangla and English conversations.**

---

## 📌 1. Project Overview
Traditional healthcare reception desks in Bangladesh face overwhelming challenges, including high call volumes, missed inquiries during peak hours, and tedious manual appointment tracking. **ByteVoice Bangladesh** bridges this gap by deploying a state-of-the-art voice AI agent to automate patient communication, securely capture patient details, and organize transcripts for administrative staff.

---

## ⚠️ 2. Problem Statement
Traditional healthcare reception and communication systems suffer from several critical bottlenecks:
* **Repetitive Patient Inquiries:** Staff spend countless hours answering repetitive questions regarding doctors' schedules, locations, and fees.
* **Missed Calls & Inquiries:** High call volumes often lead to unanswered phone calls, resulting in frustrated patients and lost opportunities.
* **Manual Bottlenecks:** Manual appointment booking and record-keeping are error-prone and time-consuming.
* **Language Barriers & Friction:** Most automated IVR systems fail to handle natural Bangla or code-switched Bangla-English effectively.

---

## 🎯 3. Objectives
The core objectives of **ByteVoice Bangladesh** are to:
* **Automate Communication:** Provide seamless, 24/7 patient communication using natural Bangla voice AI.
* **Streamline Operations:** Simplify appointment requests and automate patient information collection.
* **Reduce Staff Workload:** Minimize repetitive administrative tasks for healthcare workers, allowing them to focus on in-person patient care.
* **Maintain Organized Records:** Keep detailed call logs, conversation transcripts, and structured patient queues.

---

## ✨ 4. Key Features
* **Bangla Voice Receptionist:** Handles inquiries and conversations naturally in regional Bangla and code-switched Bangla-English.
* **Smart Appointment Management:** Automatically captures patient demographics, preferred visit times, and department choices.
* **Call & Record Management:** Logs complete conversation transcripts and call histories securely.
* **Staff Follow-up Queue:** Tracks unresolved inquiries and flags urgent patient requests requiring human intervention.

---

## 🛠️ 5. Technology Stack
* **Frontend:** Next.js, TypeScript, Tailwind CSS, Three.js / React Three Fiber
* **Backend:** Python, FastAPI, Pydantic
* **Database & Auth:** Supabase PostgreSQL, Supabase Auth
* **AI & Voice Integration:** OpenAI API, Anthropic API, Vapi Voice Platform
* **Workflow Automation:** n8n Orchestration Engine & pdfplumber Processing

---

## 📸 6. Project Architecture & UI

| Dashboard & Overview | Voice Assistant Interface |
| :---: | :---: |
| *Patient analytics and call logs management* | *Interactive 3D/Voice agent session view* |

---

## 🚀 7. Project Setup & Execution

### Step 1: Clone Repository
```bash
git clone https://github.com/moonirul/strategybyte-bangladesh-voice-ai-agent.git
cd strategybyte-bangladesh-voice-ai-agent
```

### Step 2: Setup the Backend
```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

### Step 3: Setup the Frontend
```bash
cd frontend
npm install
npm run dev
```

### Application Access Links:
* **Local Frontend:** `http://localhost:3000`
* **Local Backend Docs:** `http://localhost:8000/docs`

---

## ⚠️ 8. Current Limitations
Despite its robust capabilities, the current system has a few limitations:
* **Voice Recognition Accuracy:** Recognition precision may slightly vary depending on regional dialects, accents, and background noise.
* **Complex Clinical Queries:** Highly complex or emergency medical inquiries still require immediate human intervention.
* **Dependency on Data:** AI response quality depends heavily on the accuracy and completeness of the provided clinic information database.

---

## 🔮 9. Future Scope
* **Advanced Voice Models:** Enhance regional Bangla speech comprehension and low-latency response handling.
* **Automated Direct Booking:** Integrate directly with hospital management software (HMS) for real-time slot locking.
* **Multi-Clinic Scalability:** Expand support to onboard multiple hospitals, diagnostic centers, and specialized clinics across Bangladesh.
* **Comprehensive Analytics:** Generate deep automated call reports and patient sentiment analysis dashboards.

---

## 📄 10. License & Contact
Developed by **Md. Monirul Islam** | [ByteVoice Bangladesh Repository](https://github.com/moonirul/strategybyte-bangladesh-voice-ai-agent)