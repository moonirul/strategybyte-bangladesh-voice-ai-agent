import { defineDict } from "../types";

export const landing = defineDict({
  en: {
    "nav.primary": "Primary navigation",
    "nav.product": "Product",
    "nav.how": "How it works",
    "nav.useCases": "Use cases",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "nav.portal": "Staff Portal",
    "nav.callCta": "Talk to our Bangla caller",
    "nav.menuOpen": "Open navigation menu",
    "nav.menuClose": "Close navigation menu",

    "hero.badge": "ByteVoice Bangladesh · Demo clinic: {clinic}",
    "hero.demoMode": "Interactive Demo Mode",
    "hero.desc":
      "ByteVoice helps dental clinics, diagnostic centres, and outpatient departments handle high call volumes in Bangla—capturing patient details, appointment requests, and callback needs into a clean clinical staff portal.",
    "hero.vp1": "Answer common patient enquiries in natural Bangla",
    "hero.vp2": "Capture structured appointment requests without false confirmations",
    "hero.vp3": "Reduce repetitive front-desk reception work",
    "hero.vp4": "Organise every call, transcript, and follow-up in a staff portal",
    "hero.openPortal": "Open Staff Portal",
    "hero.note":
      "Note: The browser experience currently runs in a deterministic simulated demo mode so you can inspect the full call-to-portal workflow without external voice credentials.",
    "hero.orbLabel": "Decorative 3D voice field · WebGL / R3F",
    "hero.sampleRecord": "Sample Call Record · {clinic}",
    "hero.sampleStatus": "Requested (unconfirmed)",
    "hero.sampleQuoteEn":
      "Translation: “I want an appointment tomorrow at 5 PM with Dr. Farzana Haque for a toothache.”",
    "hero.sampleIntent": "Intent: Appointment request",
    "hero.samplePhone": "Phone",

    "how.eyebrow": "How it works",
    "how.title": "From patient call to structured clinical record in three steps.",
    "how.desc":
      "Every conversation follows a transparent lifecycle so reception teams stay in control of clinical scheduling.",
    "how.step": "STEP {n}",
    "how.s1.title": "A patient speaks naturally in Bangla",
    "how.s1.desc":
      "Callers describe their visit reason, ask about clinic opening hours, or request a callback in natural Bangla or mixed Bangla-English.",
    "how.s1.sample": "“আগামীকাল বিকাল ৫টায় অ্যাপয়েন্টমেন্ট নিতে চাই।”",
    "how.s2.title": "The assistant collects and confirms relevant details",
    "how.s2.desc":
      "ByteVoice validates Bangladeshi mobile numbers, asks clarifying questions when dates or times are ambiguous, and never guesses missing digits.",
    "how.s2.sample": "“আপনার নাম, মোবাইল নম্বর এবং পছন্দের সময় নিশ্চিত করছি…”",
    "how.s3.title": "The clinic receives a structured call record",
    "how.s3.desc":
      "Reception staff review the full Bangla transcript, extracted visit details, and unconfirmed appointment requests in the portal to confirm scheduling.",
    "how.s3.sample": "Portal: Transcript · Extracted Fields · Follow-up Queue",

    "caps.eyebrow": "Product capabilities",
    "caps.title": "Designed for clinical accuracy and front-desk reliability.",
    "caps.desc":
      "ByteVoice never fabricates medical advice or marks an appointment as confirmed before your scheduling team approves it.",
    "caps.status": "Available in demo",
    "caps.c1.title": "Bangla & Bangla-English support",
    "caps.c1.desc":
      "Handles conversational Bangla and common English medical/scheduling terms while preserving Unicode text accurately.",
    "caps.c2.title": "Appointment request handling",
    "caps.c2.desc":
      "Captures reason for visit, preferred day/time, and preferred doctor. Requests are recorded as unconfirmed until clinic staff verify availability.",
    "caps.c3.title": "Patient detail capture & validation",
    "caps.c3.desc":
      "Normalises valid Bangladeshi mobile numbers (Bangla or ASCII digits) to E.164 format and flags uncertain numbers for staff review.",
    "caps.c4.title": "Approved clinic FAQ responses",
    "caps.c4.desc":
      "Answers configured clinic opening hours and location enquiries without improvising clinical advice or unapproved fee quotes.",
    "caps.c5.title": "Human callback escalation",
    "caps.c5.desc":
      "When a caller asks an unapproved question or provides ambiguous details, ByteVoice creates a structured follow-up request for reception staff.",
    "caps.c6.title": "Structured call history & transcripts",
    "caps.c6.desc":
      "Stores sequenced transcript turns with speaker labels, timestamps, and extracted clinical intent.",
    "caps.c7.title": "Staff visibility & portal workflows",
    "caps.c7.desc":
      "Role-aware staff portal for reviewing calls, patients, appointment requests, and pending human follow-ups.",

    "uc.eyebrow": "Healthcare use cases",
    "uc.title": "Built for healthcare providers across Bangladesh.",
    "uc.desc":
      "We clearly distinguish what is active in the assessment demo today from future live telephony and outbound integrations.",
    "uc.u1.title": "Dental clinics",
    "uc.u1.badge": "Demonstrated in {clinic}",
    "uc.u1.desc":
      "Handle toothache triage questions, scaling or orthodontic consultation requests, doctor preferences, and opening-hour enquiries.",
    "uc.u2.title": "Diagnostic centres",
    "uc.u2.badge": "Supported workflow pattern",
    "uc.u2.desc":
      "Collect test booking enquiries, fasting or preparation FAQ requests, and callback requests for specialised pathology or imaging.",
    "uc.u3.title": "Hospital outpatient departments (OPD)",
    "uc.u3.badge": "Supported workflow pattern",
    "uc.u3.desc":
      "Route high-volume serial requests by specialty, capture patient contact numbers in Bangla, and queue complex cases for desk operators.",
    "uc.u4.title": "Appointment reminders & follow-up workflows",
    "uc.u4.badge": "Future outbound integration",
    "uc.u4.desc":
      "Staff can track pending follow-up requests in the portal today; automated outbound reminder calls and SMS notifications are planned for live telephony integration.",

    "price.eyebrow": "Pricing",
    "price.title": "Simple plans, priced in Bangladeshi Taka.",
    "price.desc":
      "A clear illustration of how ByteVoice plans could look for a clinic in Bangladesh. Final pricing is agreed with the StrategyByte team.",
    "price.badge": "Demo Pricing",
    "price.illustrative": "Illustrative Pricing",
    "price.note":
      "These prices are for demonstration purposes only and are not actual service charges.",
    "price.perMonth": "/month",
    "price.featured": "Most popular",
    "price.letsTalk": "Let's Talk",
    "price.cta": "Get in touch",
    "price.ctaEnterprise": "Let's talk",
    "price.otherLang": "Also shown as {value}",
    "price.col.talk": "Talk time",
    "price.col.numbers": "Phone numbers",
    "price.col.locations": "Clinic locations",
    "price.col.portal": "Staff portal",
    "price.col.booking": "Appointments",
    "price.col.support": "Support",
    "price.starter.name": "Starter",
    "price.starter.tag": "For a single small clinic getting started",
    "price.standard.name": "Standard",
    "price.standard.tag": "For busy clinics with steady call volume",
    "price.pro.name": "Pro",
    "price.pro.tag": "For high-volume clinics and diagnostic centres",
    "price.enterprise.name": "Enterprise",
    "price.enterprise.tag": "For hospital groups and multi-branch networks",
    "price.starter.talk": "250 minutes included",
    "price.standard.talk": "1,000 minutes included",
    "price.pro.talk": "2,000 minutes included",
    "price.enterprise.talk": "Custom allowance",
    "price.starter.numbers": "1 phone number",
    "price.standard.numbers": "Up to 2 phone numbers",
    "price.pro.numbers": "Up to 3 phone numbers",
    "price.enterprise.numbers": "Custom",
    "price.starter.locations": "1 clinic",
    "price.standard.locations": "1 clinic",
    "price.pro.locations": "1 clinic",
    "price.enterprise.locations": "Multiple branches",
    "price.all.portal": "Calls, patients, appointments and follow-ups",
    "price.all.booking": "Requests sent to staff to confirm",
    "price.starter.support": "Email support",
    "price.standard.support": "Priority email support",
    "price.pro.support": "Guided onboarding",
    "price.enterprise.support": "Dedicated onboarding and support",

    "faq.eyebrow": "FAQ",
    "faq.title": "Questions clinics ask us",
    "faq.desc":
      "Straight answers about what ByteVoice does today, based on the current product.",
    "faq.q1": "What is ByteVoice Bangladesh?",
    "faq.a1":
      "ByteVoice is an AI voice receptionist for dental clinics, diagnostic centres and outpatient departments. It answers patient calls in natural Bangla, captures appointment requests, and organises every call in a secure staff portal.",
    "faq.q2": "Does it confirm appointments on its own?",
    "faq.a2":
      "No. A voice request is recorded as unconfirmed. An appointment is only confirmed when clinic staff schedule it in the portal, and a booking reference is generated at that point.",
    "faq.q3": "Does it give medical advice or quote fees?",
    "faq.a3":
      "No. It answers only approved clinic information such as opening hours and location. It does not improvise clinical advice or unapproved fee quotes.",
    "faq.q4": "How are phone numbers handled?",
    "faq.a4":
      "Valid Bangladeshi mobile numbers, spoken in Bangla or English digits, are normalised to E.164 format. Numbers that cannot be verified are flagged for staff review and never guessed.",
    "faq.q5": "What happens when a caller asks something unexpected?",
    "faq.a5":
      "If a caller asks an unapproved question or gives ambiguous details, ByteVoice creates a structured follow-up request so your reception team can call back.",
    "faq.q6": "Is the voice call live today?",
    "faq.a6":
      "The browser experience currently runs a simulated Bangla demo so you can see the whole call-to-portal workflow. Live telephony is supported by the provider design and planned as a future integration.",
    "faq.q7": "Who can access patient information in the portal?",
    "faq.a7":
      "Only signed-in clinic staff. Sign-in uses Supabase Auth, access is role-based, every request is limited to the staff member's own clinic, and phone numbers can be masked depending on role.",
    "faq.q8": "Are the prices on this page real?",
    "faq.a8":
      "No. The pricing section is Demo Pricing for illustration only and does not represent actual service charges. No payment can be made on this site.",

    "cta.eyebrow": "Interactive Assessment Demo",
    "cta.title": "Test the Bangla receptionist and inspect the staff portal.",
    "cta.desc":
      "Start a simulated call right in your browser, submit an appointment request in Bangla, and review the structured call record in the {clinic} portal.",
    "cta.goPortal": "Go to Staff Portal",
    "cta.contact": "Contact:",

    "footer.tagline": "A StrategyByte product assessment build",
  },
  bn: {
    "nav.primary": "প্রধান নেভিগেশন",
    "nav.product": "পণ্য",
    "nav.how": "কীভাবে কাজ করে",
    "nav.useCases": "ব্যবহারক্ষেত্র",
    "nav.pricing": "মূল্য",
    "nav.faq": "প্রশ্নোত্তর",
    "nav.contact": "যোগাযোগ",
    "nav.portal": "স্টাফ পোর্টাল",
    "nav.callCta": "আমাদের বাংলা কলারের সাথে কথা বলুন",
    "nav.menuOpen": "নেভিগেশন মেনু খুলুন",
    "nav.menuClose": "নেভিগেশন মেনু বন্ধ করুন",

    "hero.badge": "বাইটভয়েস বাংলাদেশ · ডেমো ক্লিনিক: {clinic}",
    "hero.demoMode": "ইন্টারেক্টিভ ডেমো মোড",
    "hero.desc":
      "বাইটভয়েস ডেন্টাল ক্লিনিক, ডায়াগনস্টিক সেন্টার ও বহির্বিভাগকে বাংলায় বিপুল কল সামলাতে সাহায্য করে—রোগীর তথ্য, অ্যাপয়েন্টমেন্টের অনুরোধ ও কলব্যাকের প্রয়োজন গুছিয়ে একটি পরিচ্ছন্ন স্টাফ পোর্টালে জমা করে।",
    "hero.vp1": "রোগীদের সাধারণ প্রশ্নের উত্তর দেয় স্বাভাবিক বাংলায়",
    "hero.vp2": "ভুল নিশ্চিতকরণ ছাড়াই অ্যাপয়েন্টমেন্টের অনুরোধ গুছিয়ে নেয়",
    "hero.vp3": "রিসেপশনের পুনরাবৃত্তিমূলক কাজ কমায়",
    "hero.vp4": "প্রতিটি কল, ট্রান্সক্রিপ্ট ও ফলো-আপ এক পোর্টালে সাজিয়ে রাখে",
    "hero.openPortal": "স্টাফ পোর্টাল খুলুন",
    "hero.note":
      "দ্রষ্টব্য: ব্রাউজারের অভিজ্ঞতাটি বর্তমানে একটি সিমুলেটেড ডেমো মোডে চলে, যাতে বাইরের কোনো ভয়েস ক্রেডেনশিয়াল ছাড়াই কল থেকে পোর্টাল পর্যন্ত পুরো প্রক্রিয়া দেখা যায়।",
    "hero.orbLabel": "সাজসজ্জামূলক ৩ডি ভয়েস ফিল্ড · WebGL / R3F",
    "hero.sampleRecord": "নমুনা কল রেকর্ড · {clinic}",
    "hero.sampleStatus": "অনুরোধ করা হয়েছে (অনিশ্চিত)",
    "hero.sampleQuoteEn": "",
    "hero.sampleIntent": "উদ্দেশ্য: অ্যাপয়েন্টমেন্টের অনুরোধ",
    "hero.samplePhone": "ফোন",

    "how.eyebrow": "কীভাবে কাজ করে",
    "how.title": "রোগীর কল থেকে গোছানো ক্লিনিক্যাল রেকর্ড—তিন ধাপে।",
    "how.desc":
      "প্রতিটি কথোপকথন একটি স্বচ্ছ ধাপে ধাপে চলে, যাতে ক্লিনিকের সময়সূচির নিয়ন্ত্রণ রিসেপশন টিমের হাতেই থাকে।",
    "how.step": "ধাপ {n}",
    "how.s1.title": "রোগী স্বাভাবিকভাবে বাংলায় কথা বলেন",
    "how.s1.desc":
      "কলাররা স্বাভাবিক বাংলা বা বাংলা-ইংরেজি মিশিয়ে ভিজিটের কারণ জানান, ক্লিনিকের খোলার সময় জিজ্ঞাসা করেন বা কলব্যাক চান।",
    "how.s1.sample": "“আগামীকাল বিকাল ৫টায় অ্যাপয়েন্টমেন্ট নিতে চাই।”",
    "how.s2.title": "সহকারী প্রয়োজনীয় তথ্য সংগ্রহ ও নিশ্চিত করে",
    "how.s2.desc":
      "বাইটভয়েস বাংলাদেশি মোবাইল নম্বর যাচাই করে, তারিখ বা সময় অস্পষ্ট হলে স্পষ্টীকরণ প্রশ্ন করে এবং ছুটে যাওয়া সংখ্যা কখনো আন্দাজ করে না।",
    "how.s2.sample": "“আপনার নাম, মোবাইল নম্বর এবং পছন্দের সময় নিশ্চিত করছি…”",
    "how.s3.title": "ক্লিনিক পায় একটি গোছানো কল রেকর্ড",
    "how.s3.desc":
      "রিসেপশন স্টাফ পোর্টালে সম্পূর্ণ বাংলা ট্রান্সক্রিপ্ট, সংগৃহীত ভিজিটের তথ্য ও অনিশ্চিত অ্যাপয়েন্টমেন্টের অনুরোধ দেখে সময়সূচি নিশ্চিত করেন।",
    "how.s3.sample": "পোর্টাল: ট্রান্সক্রিপ্ট · সংগৃহীত তথ্য · ফলো-আপ তালিকা",

    "caps.eyebrow": "পণ্যের সক্ষমতা",
    "caps.title": "ক্লিনিক্যাল নির্ভুলতা ও রিসেপশনের নির্ভরযোগ্যতার জন্য তৈরি।",
    "caps.desc":
      "বাইটভয়েস কখনো চিকিৎসা-পরামর্শ বানিয়ে বলে না এবং আপনার সময়সূচি টিম অনুমোদন করার আগে কোনো অ্যাপয়েন্টমেন্ট নিশ্চিত হিসেবে চিহ্নিত করে না।",
    "caps.status": "ডেমোতে উপলব্ধ",
    "caps.c1.title": "বাংলা ও বাংলা-ইংরেজি সমর্থন",
    "caps.c1.desc":
      "কথ্য বাংলা এবং প্রচলিত ইংরেজি চিকিৎসা/সময়সূচির শব্দ বোঝে, ইউনিকোড লেখা নির্ভুলভাবে সংরক্ষণ করে।",
    "caps.c2.title": "অ্যাপয়েন্টমেন্টের অনুরোধ গ্রহণ",
    "caps.c2.desc":
      "ভিজিটের কারণ, পছন্দের দিন/সময় ও পছন্দের ডাক্তার সংগ্রহ করে। ক্লিনিক স্টাফ সময় যাচাই না করা পর্যন্ত অনুরোধ অনিশ্চিত হিসেবে থাকে।",
    "caps.c3.title": "রোগীর তথ্য সংগ্রহ ও যাচাই",
    "caps.c3.desc":
      "বৈধ বাংলাদেশি মোবাইল নম্বর (বাংলা বা ইংরেজি অঙ্ক) E.164 ফরম্যাটে রূপান্তর করে এবং অনিশ্চিত নম্বর স্টাফের পর্যালোচনার জন্য চিহ্নিত করে।",
    "caps.c4.title": "অনুমোদিত ক্লিনিক তথ্যের উত্তর",
    "caps.c4.desc":
      "নির্ধারিত খোলার সময় ও অবস্থানের প্রশ্নের উত্তর দেয়; চিকিৎসা-পরামর্শ বা অনুমোদনহীন ফির তথ্য বানিয়ে বলে না।",
    "caps.c5.title": "মানুষের কাছে কলব্যাক পাঠানো",
    "caps.c5.desc":
      "কলার অনুমোদনহীন প্রশ্ন করলে বা অস্পষ্ট তথ্য দিলে বাইটভয়েস রিসেপশন স্টাফের জন্য একটি গোছানো ফলো-আপ অনুরোধ তৈরি করে।",
    "caps.c6.title": "গোছানো কলের ইতিহাস ও ট্রান্সক্রিপ্ট",
    "caps.c6.desc":
      "বক্তার নাম, সময়চিহ্ন ও সংগৃহীত ক্লিনিক্যাল উদ্দেশ্যসহ ক্রমানুসারে ট্রান্সক্রিপ্ট সংরক্ষণ করে।",
    "caps.c7.title": "স্টাফের দৃশ্যমানতা ও পোর্টালের কাজ",
    "caps.c7.desc":
      "কল, রোগী, অ্যাপয়েন্টমেন্টের অনুরোধ ও মুলতুবি ফলো-আপ পর্যালোচনার জন্য ভূমিকা-ভিত্তিক স্টাফ পোর্টাল।",

    "uc.eyebrow": "স্বাস্থ্যসেবার ব্যবহারক্ষেত্র",
    "uc.title": "বাংলাদেশের স্বাস্থ্যসেবা প্রতিষ্ঠানের জন্য তৈরি।",
    "uc.desc":
      "আজকের অ্যাসেসমেন্ট ডেমোতে কোনটি সক্রিয় আর ভবিষ্যতের লাইভ টেলিফোনি ও আউটবাউন্ড ইন্টিগ্রেশন কোনটি—আমরা স্পষ্টভাবে আলাদা করে দেখাই।",
    "uc.u1.title": "ডেন্টাল ক্লিনিক",
    "uc.u1.badge": "{clinic}-এ প্রদর্শিত",
    "uc.u1.desc":
      "দাঁতের ব্যথার প্রাথমিক প্রশ্ন, স্কেলিং বা অর্থোডন্টিক পরামর্শের অনুরোধ, ডাক্তারের পছন্দ ও খোলার সময়ের প্রশ্ন সামলায়।",
    "uc.u2.title": "ডায়াগনস্টিক সেন্টার",
    "uc.u2.badge": "সমর্থিত কর্মপ্রবাহ",
    "uc.u2.desc":
      "পরীক্ষার বুকিংয়ের প্রশ্ন, খালি পেটে থাকা বা প্রস্তুতির প্রশ্ন এবং বিশেষায়িত প্যাথলজি বা ইমেজিংয়ের কলব্যাক অনুরোধ সংগ্রহ করে।",
    "uc.u3.title": "হাসপাতালের বহির্বিভাগ (ওপিডি)",
    "uc.u3.badge": "সমর্থিত কর্মপ্রবাহ",
    "uc.u3.desc":
      "বিশেষত্ব অনুযায়ী অধিক সংখ্যক সিরিয়ালের অনুরোধ আলাদা করে, রোগীর যোগাযোগ নম্বর বাংলায় সংগ্রহ করে এবং জটিল ক্ষেত্র ডেস্ক অপারেটরের জন্য তালিকাভুক্ত করে।",
    "uc.u4.title": "অ্যাপয়েন্টমেন্ট রিমাইন্ডার ও ফলো-আপ",
    "uc.u4.badge": "ভবিষ্যৎ আউটবাউন্ড ইন্টিগ্রেশন",
    "uc.u4.desc":
      "স্টাফ আজই পোর্টালে মুলতুবি ফলো-আপ অনুরোধ অনুসরণ করতে পারেন; স্বয়ংক্রিয় আউটবাউন্ড রিমাইন্ডার কল ও এসএমএস লাইভ টেলিফোনি ইন্টিগ্রেশনের জন্য পরিকল্পিত।",

    "price.eyebrow": "মূল্য",
    "price.title": "সহজ প্ল্যান, বাংলাদেশি টাকায় মূল্য।",
    "price.desc":
      "বাংলাদেশের একটি ক্লিনিকের জন্য বাইটভয়েসের প্ল্যান কেমন হতে পারে—তার একটি স্পষ্ট উদাহরণ। চূড়ান্ত মূল্য স্ট্র্যাটেজিবাইট টিমের সাথে নির্ধারিত হবে।",
    "price.badge": "ডেমো মূল্য",
    "price.illustrative": "উদাহরণমূলক মূল্য",
    "price.note":
      "এই মূল্যগুলো শুধুমাত্র প্রদর্শনের উদ্দেশ্যে দেওয়া হয়েছে এবং প্রকৃত সেবার চার্জ নয়।",
    "price.perMonth": "/মাস",
    "price.featured": "সবচেয়ে জনপ্রিয়",
    "price.letsTalk": "কথা বলুন",
    "price.cta": "যোগাযোগ করুন",
    "price.ctaEnterprise": "কথা বলুন",
    "price.otherLang": "ইংরেজিতে: {value}",
    "price.col.talk": "কথা বলার সময়",
    "price.col.numbers": "ফোন নম্বর",
    "price.col.locations": "ক্লিনিকের অবস্থান",
    "price.col.portal": "স্টাফ পোর্টাল",
    "price.col.booking": "অ্যাপয়েন্টমেন্ট",
    "price.col.support": "সহায়তা",
    "price.starter.name": "স্টার্টার",
    "price.starter.tag": "শুরু করা একটি ছোট ক্লিনিকের জন্য",
    "price.standard.name": "স্ট্যান্ডার্ড",
    "price.standard.tag": "নিয়মিত কলের চাপ থাকা ব্যস্ত ক্লিনিকের জন্য",
    "price.pro.name": "প্রো",
    "price.pro.tag": "বেশি কল সামলানো ক্লিনিক ও ডায়াগনস্টিক সেন্টারের জন্য",
    "price.enterprise.name": "এন্টারপ্রাইজ",
    "price.enterprise.tag": "হাসপাতাল গ্রুপ ও একাধিক শাখার নেটওয়ার্কের জন্য",
    "price.starter.talk": "২৫০ মিনিট অন্তর্ভুক্ত",
    "price.standard.talk": "১,০০০ মিনিট অন্তর্ভুক্ত",
    "price.pro.talk": "২,০০০ মিনিট অন্তর্ভুক্ত",
    "price.enterprise.talk": "কাস্টম বরাদ্দ",
    "price.starter.numbers": "১টি ফোন নম্বর",
    "price.standard.numbers": "সর্বোচ্চ ২টি ফোন নম্বর",
    "price.pro.numbers": "সর্বোচ্চ ৩টি ফোন নম্বর",
    "price.enterprise.numbers": "কাস্টম",
    "price.starter.locations": "১টি ক্লিনিক",
    "price.standard.locations": "১টি ক্লিনিক",
    "price.pro.locations": "১টি ক্লিনিক",
    "price.enterprise.locations": "একাধিক শাখা",
    "price.all.portal": "কল, রোগী, অ্যাপয়েন্টমেন্ট ও ফলো-আপ",
    "price.all.booking": "নিশ্চিত করার জন্য অনুরোধ স্টাফের কাছে যায়",
    "price.starter.support": "ইমেইল সহায়তা",
    "price.standard.support": "অগ্রাধিকার ইমেইল সহায়তা",
    "price.pro.support": "নির্দেশিত অনবোর্ডিং",
    "price.enterprise.support": "ডেডিকেটেড অনবোর্ডিং ও সহায়তা",

    "faq.eyebrow": "প্রশ্নোত্তর",
    "faq.title": "ক্লিনিকগুলো আমাদের যা জিজ্ঞাসা করে",
    "faq.desc":
      "বাইটভয়েস আজ কী করে—বর্তমান পণ্যের ভিত্তিতে সরাসরি উত্তর।",
    "faq.q1": "বাইটভয়েস বাংলাদেশ কী?",
    "faq.a1":
      "বাইটভয়েস ডেন্টাল ক্লিনিক, ডায়াগনস্টিক সেন্টার ও বহির্বিভাগের জন্য একটি এআই ভয়েস রিসেপশনিস্ট। এটি স্বাভাবিক বাংলায় রোগীর কল ধরে, অ্যাপয়েন্টমেন্টের অনুরোধ সংগ্রহ করে এবং প্রতিটি কল একটি নিরাপদ স্টাফ পোর্টালে সাজিয়ে রাখে।",
    "faq.q2": "এটি কি নিজে থেকে অ্যাপয়েন্টমেন্ট নিশ্চিত করে?",
    "faq.a2":
      "না। ভয়েসে করা অনুরোধ অনিশ্চিত হিসেবে সংরক্ষিত হয়। ক্লিনিক স্টাফ পোর্টালে সময় নির্ধারণ করলেই কেবল অ্যাপয়েন্টমেন্ট নিশ্চিত হয়, এবং তখনই একটি বুকিং রেফারেন্স তৈরি হয়।",
    "faq.q3": "এটি কি চিকিৎসা-পরামর্শ দেয় বা ফি বলে?",
    "faq.a3":
      "না। এটি শুধু অনুমোদিত ক্লিনিক তথ্য, যেমন খোলার সময় ও অবস্থান, জানায়। চিকিৎসা-পরামর্শ বা অনুমোদনহীন ফির তথ্য বানিয়ে বলে না।",
    "faq.q4": "ফোন নম্বর কীভাবে সামলানো হয়?",
    "faq.a4":
      "বাংলা বা ইংরেজি অঙ্কে বলা বৈধ বাংলাদেশি মোবাইল নম্বর E.164 ফরম্যাটে রূপান্তরিত হয়। যে নম্বর যাচাই করা যায় না, সেটি আন্দাজ না করে স্টাফের পর্যালোচনার জন্য চিহ্নিত করা হয়।",
    "faq.q5": "কলার অপ্রত্যাশিত কিছু জিজ্ঞাসা করলে কী হয়?",
    "faq.a5":
      "কলার অনুমোদনহীন প্রশ্ন করলে বা অস্পষ্ট তথ্য দিলে বাইটভয়েস একটি গোছানো ফলো-আপ অনুরোধ তৈরি করে, যাতে আপনার রিসেপশন টিম ফিরতি কল করতে পারে।",
    "faq.q6": "ভয়েস কল কি আজই লাইভ?",
    "faq.a6":
      "ব্রাউজারের অভিজ্ঞতাটি এখন একটি সিমুলেটেড বাংলা ডেমো, যাতে কল থেকে পোর্টাল পর্যন্ত পুরো প্রক্রিয়া দেখা যায়। লাইভ টেলিফোনি প্রোভাইডার-ডিজাইনে সমর্থিত এবং ভবিষ্যৎ ইন্টিগ্রেশন হিসেবে পরিকল্পিত।",
    "faq.q7": "পোর্টালে রোগীর তথ্য কারা দেখতে পারেন?",
    "faq.a7":
      "শুধু সাইন-ইন করা ক্লিনিক স্টাফ। সাইন-ইন হয় Supabase Auth দিয়ে, প্রবেশাধিকার ভূমিকা-ভিত্তিক, প্রতিটি অনুরোধ স্টাফের নিজের ক্লিনিকের মধ্যেই সীমাবদ্ধ, এবং ভূমিকা অনুযায়ী ফোন নম্বর আংশিক ঢেকে রাখা হতে পারে।",
    "faq.q8": "এই পাতার মূল্যগুলো কি আসল?",
    "faq.a8":
      "না। মূল্য অংশটি শুধু উদাহরণের জন্য ডেমো মূল্য এবং প্রকৃত সেবার চার্জ নয়। এই সাইটে কোনো অর্থ পরিশোধ করা যায় না।",

    "cta.eyebrow": "ইন্টারেক্টিভ অ্যাসেসমেন্ট ডেমো",
    "cta.title": "বাংলা রিসেপশনিস্ট পরীক্ষা করুন এবং স্টাফ পোর্টাল ঘুরে দেখুন।",
    "cta.desc":
      "ব্রাউজারেই একটি সিমুলেটেড কল শুরু করুন, বাংলায় অ্যাপয়েন্টমেন্টের অনুরোধ জানান এবং {clinic} পোর্টালে গোছানো কল রেকর্ড দেখুন।",
    "cta.goPortal": "স্টাফ পোর্টালে যান",
    "cta.contact": "যোগাযোগ:",

    "footer.tagline": "স্ট্র্যাটেজিবাইটের একটি পণ্য অ্যাসেসমেন্ট বিল্ড",
  },
});
