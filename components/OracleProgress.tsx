'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Brain, Zap, Eye } from 'lucide-react'
import type { MLPredictResponse, PredictionTier, TierProgress } from '@/types'

// ─── Tier Configuration ─────────────────────────────────────

interface TierConfig {
  label: string
  emoji: string
  color: string
  icon: typeof Sparkles
  message: (progress: TierProgress) => string
}

const TIER_CONFIG: Record<PredictionTier, TierConfig> = {
  COLD_START: {
    label: 'AWAKENING',
    emoji: '🌱',
    color: 'var(--green)',
    icon: Sparkles,
    message: (p) => `${p.current}/5 entries — Oracle is learning...`,
  },
  EARLY_SIGNAL: {
    label: 'EARLY_SIGNAL',
    emoji: '📊',
    color: 'var(--blue)',
    icon: Eye,
    message: (p) => `${p.current}/15 entries — Patterns emerging!`,
  },
  WARM_UP: {
    label: 'WARM_UP',
    emoji: '🔮',
    color: 'var(--purple)',
    icon: Brain,
    message: (p) => `${p.current}/30 entries — Almost ready!`,
  },
  ML_READY: {
    label: 'NEURAL_ONLINE',
    emoji: '⚡',
    color: 'var(--pink)',
    icon: Zap,
    message: () => 'Oracle is ONLINE',
  },
}

// ─── Milestone thresholds ───────────────────────────────────
const MILESTONES = [
  { count: 5, label: 'Early Patterns', tier: 'EARLY_SIGNAL' as PredictionTier },
  { count: 15, label: 'Warm Up', tier: 'WARM_UP' as PredictionTier },
  { count: 30, label: 'Neural Online', tier: 'ML_READY' as PredictionTier },
]

// ─── Component ──────────────────────────────────────────────

interface OracleProgressProps {
  prediction: MLPredictResponse | null
  loading?: boolean
}

export default function OracleProgress({ prediction, loading }: OracleProgressProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)

  const tier = prediction?.tier || 'COLD_START'
  const progress = prediction?.progress || { current: 0, target: 30, percent: 0 }
  const config = TIER_CONFIG[tier]
  const TierIcon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(progress.percent), 300)
    return () => clearTimeout(timer)
  }, [progress.percent])

  // SVG ring dimensions
  const size = 120
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: 16,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: config.color,
      }}>
        <TierIcon size={14} />
        {config.label}
      </div>

      {/* Progress Ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--grid-color)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: `drop-shadow(0 0 6px ${config.color})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28 }}>{config.emoji}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: config.color,
            fontFamily: '"VT323", monospace',
            letterSpacing: 1,
          }}>
            {progress.percent}%
          </span>
        </div>
      </div>

      {/* Message */}
      <p style={{
        margin: 0,
        fontSize: 12,
        color: 'var(--text-color)',
        opacity: 0.7,
        textAlign: 'center',
        fontFamily: '"Space Grotesk", sans-serif',
      }}>
        {loading ? 'Connecting to Oracle...' : config.message(progress)}
      </p>

      {/* Tip */}
      {prediction?.tip && (
        <p style={{
          margin: 0,
          padding: '8px 12px',
          borderRadius: 8,
          background: `color-mix(in srgb, ${config.color} 10%, transparent)`,
          fontSize: 11,
          color: 'var(--text-color)',
          opacity: 0.8,
          textAlign: 'center',
          fontFamily: '"Space Grotesk", sans-serif',
          lineHeight: 1.4,
        }}>
          💡 {prediction.tip}
        </p>
      )}

      {/* Milestones */}
      <div style={{
        display: 'flex',
        gap: 8,
        width: '100%',
        justifyContent: 'center',
      }}>
        {MILESTONES.map((m) => {
          const reached = progress.current >= m.count
          return (
            <div
              key={m.count}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 20,
                background: reached
                  ? `color-mix(in srgb, ${TIER_CONFIG[m.tier].color} 20%, transparent)`
                  : 'var(--btn-bg)',
                border: `1px solid ${reached ? TIER_CONFIG[m.tier].color : 'var(--grid-color)'}`,
                fontSize: 10,
                fontWeight: 600,
                color: reached ? TIER_CONFIG[m.tier].color : 'var(--label-color)',
                fontFamily: '"VT323", monospace',
                letterSpacing: 1,
                transition: 'all 0.3s ease',
              }}
            >
              {reached ? '✓' : m.count}
              <span style={{ fontSize: 9 }}>{m.label.toUpperCase()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
