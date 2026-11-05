# Database Design & ER Diagram — ByteVoice Bangladesh

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
  clinics ||--o{ profiles : "has staff"
  clinics ||--o{ doctors : "employs"
  clinics ||--o{ patients : "registers"
  clinics ||--o{ calls : "receives"
  clinics ||--o{ appointments : "schedules"
  clinics ||--o{ follow_up_requests : "queues"

  patients ||--o{ calls : "makes"
  patients ||--o{ appointments : "books"
  patients ||--o{ follow_up_requests : "needs callback"

  calls ||--o| call_extractions : "extracts"
  calls ||--o{ transcript_turns : "contains"
  calls ||--o| appointments : "initiates request"
  calls ||--o| follow_up_requests : "escalates to"

  doctors ||--o{ appointments : "assigned to"
  profiles ||--o{ follow_up_requests : "assigned to"

  clinics {
    uuid id PK
    text name
    text slug UK
    text timezone
    text opening_hours
    timestamptz created_at
  }

  profiles {
    uuid id PK,FK
    uuid clinic_id FK
    text full_name
    text role
  }

  patients {
    uuid id PK
    uuid clinic_id FK
    text full_name
    text phone_e164
  }

  calls {
    uuid id PK
    uuid clinic_id FK
    uuid patient_id FK
    text provider
    text provider_call_id
    text call_mode
    timestamptz started_at
    timestamptz ended_at
    int duration_seconds
    text status
    text outcome
  }

  call_extractions {
    uuid id PK
    uuid call_id FK,UK
    text intent
    text reason_for_visit
    text preferred_date_text
    date preferred_date
    time preferred_time
    timestamptz preferred_datetime
    text preferred_doctor
    boolean patient_name_confirmed
    boolean phone_confirmed
    text booking_status
    boolean requires_human_followup
  }

  transcript_turns {
    uuid id PK
    uuid call_id FK
    int sequence_number
    text speaker
    text text_bn
    text text_en
    int timestamp_ms
  }

  appointments {
    uuid id PK
    uuid clinic_id FK
    uuid patient_id FK
    uuid call_id FK,UK
    uuid doctor_id FK
    text requested_preference
    timestamptz scheduled_start
    text status
    text booking_reference UK
  }

  follow_up_requests {
    uuid id PK
    uuid clinic_id FK
    uuid call_id FK,UK
    uuid patient_id FK
    text reason
    text status
    uuid assigned_to FK
  }
```

## 2. Schema Refinements & Rationale

All 9 recommended tables from the specification are implemented in [`backend/migrations/001_initial_schema.sql`](../backend/migrations/001_initial_schema.sql) with two deliberate refinements:

1. **`call_extractions.preferred_date_text` & `appointments.requested_preference`**:
   - Callers often express preferences in natural Bangla phrases such as `"আগামীকাল বিকাল ৫টায়"` or ambiguous phrases like `"কাল ৫টা"`.
   - Storing `preferred_date_text` alongside `preferred_date`, `preferred_time`, and `preferred_datetime` ensures we never lose what the patient actually said—even when our conservative parser refuses to guess an ambiguous time.
2. **Partial Unique Index on Verified Patient Phone Numbers**:
   - `CREATE UNIQUE INDEX uq_patients_clinic_phone ON public.patients(clinic_id, phone_e164) WHERE phone_e164 IS NOT NULL;`
   - Prevents duplicate patient records within a clinic when a valid E.164 Bangladeshi mobile number is captured, while allowing multiple unverified/incomplete caller records where `phone_e164` is `NULL`.
3. **Database-Enforced Booking Integrity**:
   - `CONSTRAINT chk_confirmed_requires_schedule CHECK (status <> 'confirmed' OR scheduled_start IS NOT NULL)` on `appointments` makes it impossible to mark an appointment as `confirmed` without an explicit scheduled timestamp.
