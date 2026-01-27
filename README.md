# 🧬 MoodSlayer: Elite Neural Tracking Suite

**MoodSlayer** is a high-performance, gamified lifestyle tracking application that leverages browser-side Neural Networks to decode and predict your mental and physical patterns.

![License](https://img.shields.io/badge/Architecture-Elite-brightgreen)
![Tech](https://img.shields.io/badge/Neural-TensorFlow.js-pink)
![Tech](https://img.shields.io/badge/Framework-Next.js_14-blue)

---

## 🦾 Key Features

### 1. Neural Intelligence (The "Elite" Suite)
*   **Vibe Projection**: A custom Aura visualization that predicts your "Tomorrow State" using a sequential Neural Network.
*   **Neural Weights (XAI)**: Local Explainability engine that calculates exactly how much each habit (Gym, Mantra, etc.) is influencing your mood prediction in real-time.
*   **Synergy Radar**: Automatically detects hidden correlations between habits (e.g., how Yoga sessions might be driving your Social Battery).
*   **Anomaly Detection**: Proactive "System Glitch" alerts that trigger when your daily behavior deviates significantly from your established 30-day baseline.
*   **Vibe Archetypes**: Unsupervised clustering that categorizes your behavioral phase into personas like `PRODUCTIVE_MONK`, `VOID_DWELLER`, or `VIBE_MAXIMIZER`.
*   **Temporal Lag Logic**: Analyzes the "Memory Influence" of yesterday's actions on today's state.

### 2. Gamified Core
*   **Progressive Leveling**: Gain XP for Every sync and habit completion.
*   **Streak Mechanics**: Dynamic streak calculation derived from live database entries (not static flags).
*   **Neural Unlocks**: Unlock specific dashboard capabilities as you rank up from Level 1 to Level 10.

### 3. "The Oracle" Dashboard
*   **Interactive Predictors**: Toggle specific habits to see their mathematical correlation with your "Primary Target" (Mood or any other habit).
*   **Neural Forecaster**: Real-time confidence score (Neural Stability) and status monitoring.
*   **Neural Grid**: A dense, high-fidelity historical heatmap of your daily performance.

---

## 🛠️ Technical Stack

*   **Frontend**: Next.js 14 (App Router), Lucide React, Recharts.
*   **Backend**: Next-Auth (v5), MongoDB (Atlas/Local), custom Service Layer.
*   **ML Core**: TensorFlow.js (Sequential Model with Dropout), Pearson correlation engine.
*   **Testing**: "Neural Cluster" persona seeding script (`scripts/seed_cluster.js`).

---

## 👥 Neural Cluster (Test Accounts)
For stress-testing the AI's pattern recognition, use these pre-seeded personas:

- `monk@mood.com`: 100% Consistency.
- `chaos@mood.com`: Random Data.
- `glitch@mood.com`: Pattern breaks (Tests Anomalies).
- `warrior@mood.com`: Weekly patterns (Tests Lags).
*(Password for all: `password123`)*

---

## 🚀 Getting Started

1. **Spin up MongoDB**:
   ```bash
   docker-compose up -d
   ```
2. **Setup Env**:
   Add `MONGODB_URI` and `AUTH_SECRET` to `.env.local`.
3. **Seed the Cluster**:
   ```bash
   node scripts/seed_cluster.js
   ```
4. **Initiate Core**:
   ```bash
   npm run dev
   ```

---
🧬 **Stay Synced. Slayer.**
