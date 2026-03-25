// MoodSlayer — Shared Type Definitions

// ─── User & Profile ────────────────────────────────────────

export interface UserProfile {
  _id: string
  name?: string
  email: string
  displayName?: string
  primaryGoal?: "mood" | "energy" | "productivity" | "all"
  tracksCycle?: boolean
  cycleLength?: number
  lastPeriodStart?: string | null
  timezone?: string
  onboardingComplete?: boolean
}

// ─── Trackables & Entries ───────────────────────────────────

export interface Trackable {
  id: string
  name: string
  type: "boolean" | "number" | "text" | "date"
  category?: string
  icon?: string
  color?: string
  userId?: string
}

export interface Entry {
  _id?: string
  userId: string
  date: string
  mood?: string
  data: Record<string, unknown>
  createdAt?: string
  lastModified?: string
}

// ─── ML Prediction ──────────────────────────────────────────

export type PredictionTier = "COLD_START" | "EARLY_SIGNAL" | "WARM_UP" | "ML_READY"

export interface MLPredictResponse {
  prediction: string | null
  confidence: number | null
  tier: PredictionTier
  probabilities: Record<string, number> | null
  explanations: Record<string, SHAPExplanation> | null
  progress: TierProgress | null
  message: string | null
  tip: string | null
  modelVersion: number | null
  dataPointsUsed: number | null
  cycleDay: number | null
  cyclePhase: string | null
}

export interface SHAPExplanation {
  impact: number
  direction: "positive" | "negative"
  rank?: number
}

export interface TierProgress {
  current: number
  target: number
  percent: number
}

// ─── ML Training ────────────────────────────────────────────

export interface MLTrainResponse {
  status: string
  modelVersion: number | null
  f1Score: number | null
  dataPointsUsed: number | null
  tier: PredictionTier | null
  warnings: string[]
}

// ─── ML Insights ────────────────────────────────────────────

export interface MLInsightsResponse {
  correlations: Correlation[]
  moodDistribution?: Record<string, number>
  totalEntries?: number
  dateRange?: { start: string | null; end: string | null }
  message?: string
}

export interface Correlation {
  feature: string
  correlation: number
  direction: "positive" | "negative"
  strength: "strong" | "moderate" | "weak"
}

// ─── ML Health ──────────────────────────────────────────────

export interface MLHealthResponse {
  status: "ok" | "degraded"
  database: string
}

// ─── Cycle Tracker ──────────────────────────────────────────

export interface CycleInfo {
  cycleDay: number
  cycleLength: number
  phase: "menstrual" | "follicular" | "ovulation" | "luteal" | "late"
  phaseLabel: string
  phaseColor: string
  phaseDesc: string
  phaseEmoji: string
  daysUntilNextPeriod: number
  progress: number
  isLate: boolean
  daysLate: number
}
