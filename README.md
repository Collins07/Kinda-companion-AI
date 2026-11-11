# Kinda Care AI - WhatsApp Caregiver Companion for Child Development

> An empathetic, low-tech, WhatsApp-first AI companion that sits between parents/caregivers, child everyday activities, and qualified human specialists. Built specifically for African & Kenyan families with the **5-Brains Architecture**, long-term memory feedback store, RAG-augmented developmental activity guidance, and Kenya ODPC data protection compliance.

---

## 🌟 Key Capabilities

### 1. The 5-Brains Architecture
1. **Conversation Brain**:
   - Culturally attuned, warm, and natural (understands Kenyan Sheng, Swahili phrases like *"Hiyo bado"*, *"alizipangua"*, *"habari"*, *"mambo"*, *"pole"*).
   - **Caregiver Rest Mode**: When a parent says *"I'm exhausted"*, the bot NEVER responds with a developmental lesson. It validates their fatigue: *"That sounds like a hard day. You don't have to do an activity right now. Would you prefer to take a break or do a 2-minute calming breathing together?"*
2. **Memory Brain**:
   - Maintains a structured child profile (name, age, developmental stage, strengths, sensitivities like red-coded tiles aversion, past milestones).
   - Stores parental observations (e.g., *"Today Bravin really did a puzzle kit alone"* or *"for the last few days Sharon has been singing using complete words"*) into long-term feedback memory to inform future chats.
3. **Recommendation Brain (RAG Augmented)**:
   - Recommends non-kit-restricted activities across **Reading, Spelling, Drawing, Sensory Play, Singing, and Motor Skills**.
   - Pulls from a verified library of pediatric occupational therapy protocols (e.g., Step-by-Step Color Desensitization Ladder).
4. **Engagement Brain**:
   - Contextual micro-nudges that feel like gentle emotional check-ins rather than robotic alarm reminders.
5. **Escalation Brain**:
   - Identifies when therapist intervention is needed (e.g., sensory resistance to red tiles) and schedules a 30-minute virtual session with verified specialists (e.g., Dr. Wanjiku Mwangi, OTR/L in Kiambu/Virtual).
   - Automatically routes emergency or manager requests (`[ALERT_ADMIN]`) to the admin's personal Kenyan phone.

### 2. Longitudinal Child Progress Reports
- Compiles child observations from day 1 to present.
- Visual domain progress bars (Cognitive, Speech, Sensory, Motor, Socio-Emotional).
- Parent verbatim quote highlights with developmental significance.
- Sensory evolution and therapist commentary.
- Ready for printing or sharing with pediatricians and schools.

### 3. Kenya ODPC Data Protection Compliance
- Strict compliance with Kenya Office of the Data Protection Commissioner (ODPC) guidelines for children's data.
- Explicit parental consent recording before profile creation.
- Parental Right to be Informed, Right to Access, and Right to Delete/Forget.

### 4. Meta WhatsApp Business Cloud API & Webhooks
- Webhook verification endpoint: `GET /api/webhook/whatsapp` (`hub.mode`, `hub.verify_token`, `hub.challenge`).
- Inbound event handler: `POST /api/webhook/whatsapp`.
- Outbound WhatsApp sender via Meta Graph API (`v21.0`).
- M-Pesa STK Push simulator and Daraja webhook callback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- Google Gemini API Key (from Google AI Studio)
- Meta Developer Account (for live WhatsApp Cloud API)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your keys:
```bash
GEMINI_API_KEY="your_gemini_api_key"
WHATSAPP_VERIFY_TOKEN="kinda_care_webhook_secret_2026"
WHATSAPP_TOKEN="your_meta_cloud_api_token"
WHATSAPP_PHONE_NUMBER_ID="your_meta_phone_number_id"
ADMIN_ALERT_PHONE="+254712345678"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive WhatsApp simulator and 5-Brains monitor.

### 4. Run Production Server
```bash
npm run build
npm start
```

---

## 📡 Meta WhatsApp Webhook Setup

1. In **Meta for Developers** (`developers.facebook.com`), open your WhatsApp App.
2. Under **WhatsApp > Configuration > Edit Webhook**:
   - **Callback URL**: `https://your-domain.com/api/webhook/whatsapp`
   - **Verify Token**: `kinda_care_webhook_secret_2026`
3. Under **Webhook fields**, click **Manage** and subscribe to `messages`.
4. Send a text from your phone to the WhatsApp Business Number. The 5-brain engine will process the text and respond instantly!

---

## 📤 Push & Publish to GitHub

To publish this repository on your GitHub account, run:
```bash
git init
git add .
git commit -m "feat: complete kinda care AI 5-brain whatsapp companion service"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/kinda-care-ai.git
git push -u origin main
```

---

## 📄 License
Apache-2.0
