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

- **Frontend:** Bolt.new (React-based UI)
- **Backend:** Node.js (API layer to call OpenAI Assistants API)
- **AI Model:** `gpt-4.1` (with Code Interpreter enabled)
- **Version Control:** Bolt.new

---

## 💻 Demo link

- https://psalia-v1.bolt.host/

