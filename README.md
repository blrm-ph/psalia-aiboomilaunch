# psalia-aiboomilaunch
An MVP of Psalia - AI enabled brand creative evaluator

Psalia is a web application that evaluates static brand creatives for visual consistency, tone alignment, and (optionally) e-commerce product presentation quality.  
It learns a brand’s identity once, generates a **Brand Interpretation Profile (BIP)**, and uses that profile to score new creatives with clear, actionable recommendations.

---

## 🚀 Key Features

- **Brand Interpretation Profile (BIP):**  
  Upload brand style references, logo files, tone samples, and target audience to define your brand’s visual + verbal identity.

- **Creative Scoring:**  
  Upload one or multiple creatives to receive scores based on:
  - Logo usage evaluation
  - Color + typography consistency check
  - Imagery & composition style alignment
  - Tone of voice and messaging accuracy
  - Audience and platform fit
  - Product visibility + dominance scoring (if e-commerce enabled)
  
- **Actionable Recommendations:**  
  Every low-scoring parameter includes specific visual or messaging improvements.

- **Shareable Results:**  
  The result output from the AI can be added to with additional feedback from the user and shared via email with a partner/colleague. 

---

## 🧠 Architecture Overview

| Layer | Responsibility |
|------|----------------|
| **Webapp UI** | Collects brand inputs + creative uploads, displays results |
| **Assistant (OpenAI)** | Performs scoring, reasoning, structured output, CSV generation |
| **Backend** | Stores BIP + scoring output |

All brand and scoring data is persisted in the **webapp**.

---

## 🏗️ Tech Stack

Built on Bolt.new

**Frontend**
React 18.3.1 - UI framework
TypeScript 5.5.3 - Type safety
Vite 5.4.2 - Build tool and dev server
Tailwind CSS 3.4.1 - Styling framework with PostCSS and Autoprefixer
Lucide React 0.344.0 - Icon library

**Backend & Services**
Bolt Database - Backend platform providing:
PostgreSQL database
Authentication (email/OTP)
Edge Functions (serverless functions)
Bolt Database Edge Functions (3 deployed):
score-creatives - Processes and scores creative uploads
send-feedback - Sends feedback emails
send-otp - Handles OTP email delivery
OpenAI 6.8.1 - AI integration for creative analysis (GPT-4 Vision)

**Database**
PostgreSQL (via Bolt Database) with tables:
creative_approvals - Stores approval states
users and otp tables - Authentication management

**Development Tools**
ESLint - Code linting with React-specific plugins
TypeScript ESLint - TypeScript linting rules

The application is a single-page React app that uses Bolt Database for authentication, data persistence, and serverless functions, with OpenAI's GPT-4 Vision API for intelligent creative evaluation.

---

## 💻 Demo Link

- https://psalia-v1.bolt.host/

---

## 📹 Loom Demo Video

- https://psalia-v1.bolt.host/](https://www.loom.com/share/aa7e9702783c4369ab0e9ecfa40f6e07


