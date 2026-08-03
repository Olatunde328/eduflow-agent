# 🎓 EduFlow SkillPay Agent

> **Verified Learning. Autonomous USDC.**
>
> An AI-powered programmable payment agent that verifies learning milestones and automatically releases authorized USDC on Arc using Circle Developer-Controlled Wallets.

---

## 🚀 Overview

EduFlow is an agentic learning commerce platform built on **Arc** that transforms how tutoring and educational services are paid.

Instead of paying tutors upfront or relying on manual verification, EduFlow evaluates submitted learning evidence against payer-defined policies. When all conditions are satisfied, the SkillPay Agent authorizes and executes a real USDC payment through a Circle Developer-Controlled Wallet to an on-chain escrow agreement.

Every payment is:

- ✅ Policy verified
- ✅ Smart-contract enforced
- ✅ Executed by Circle
- ✅ Recorded on Arc
- ✅ Fully auditable

---

# ✨ Problem

Traditional tutoring payments have several challenges:

- Parents pay before learning outcomes are verified.
- Tutors wait for manual approval before receiving payment.
- There is little transparency around milestone completion.
- Payment decisions rely heavily on trust instead of programmable rules.

---

# 💡 Solution

EduFlow introduces programmable educational commerce.

The SkillPay Agent evaluates learning evidence such as:

- Lesson duration
- Assessment score
- Learner confirmation
- Requested payment
- Remaining escrow budget

Only when every policy rule passes does the agent authorize a payment.

Circle then executes the transaction using a Developer-Controlled Wallet while the Arc smart contract enforces escrow limits and milestone restrictions.

---

# ⚙️ How It Works

```text
Parent funds agreement
        │
        ▼
Arc Smart Contract Escrow
        │
        ▼
Tutor submits lesson evidence
        │
        ▼
SkillPay Policy Engine
        │
        ▼
PAY / HOLD / REJECT
        │
        ▼
Circle Developer-Controlled Wallet
        │
        ▼
USDC Settlement on Arc
        │
        ▼
Immutable On-chain Receipt
```

---

# 🧠 Features

- ✅ AI-assisted policy evaluation
- ✅ Deterministic payment engine
- ✅ Circle Developer-Controlled Wallet integration
- ✅ Arc smart-contract escrow
- ✅ Live USDC settlement
- ✅ Evaluation-only mode
- ✅ Live payment execution
- ✅ Full audit trail
- ✅ On-chain transaction receipts
- ✅ Spending limits enforced automatically

---

# 🏗 Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Node.js
- Express

### Blockchain

- Arc Testnet
- Solidity Smart Contracts

### Payments

- Circle Developer-Controlled Wallets
- USDC

### Deployment

- Vercel (Frontend)
- Vercel Serverless API

---

# 🔐 Smart Contract

Network:

Arc Testnet

Contract:

```
0xbc8048e42ea110b91c5186756d55d3c92011e3c2
```

---

# 💵 Live Demo

Frontend

```
https://eduflow-agent.vercel.app
```

Backend

```
https://eduflow-agent-api.vercel.app/api/health
```

---

# 🎬 Demo Flow

1. Open EduFlow
2. View funded learning agreement
3. Submit lesson evidence
4. Evaluate policy
5. Receive PAY decision
6. Execute Circle payment
7. View Arc transaction receipt
8. Verify immutable on-chain settlement

---

# 🧾 Policy Rules

The SkillPay Agent verifies:

- Minimum lesson duration
- Learner confirmation
- Assessment threshold
- Maximum milestone payment
- Auto-payment authority
- Remaining escrow budget

Only when every rule succeeds will payment be authorized.

---

# 🔎 Auditability

Each successful payment records:

- Circle Transaction ID
- Arc Transaction Hash
- Agreement ID
- Milestone ID
- Authorized Amount
- Execution Timestamp

---

# 🌍 Why EduFlow Matters

EduFlow demonstrates how programmable money and autonomous agents can improve trust in education.

Instead of relying on manual payment approvals, educational agreements become transparent, automated, and verifiable.

---

# 👤 Author

**Olatunde Olagoke**

GitHub

https://github.com/Olatunde328

---

## Built for

**Arc Agentic Commerce Hackathon**

Powered by:

- Arc
- Circle
- USDC
- Vercel