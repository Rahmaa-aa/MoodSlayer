'use client'

import { Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import type { MLPredictResponse, SHAPExplanation } from '@/types'

// ─── Mood Configuration ─────────────────────────────────────

const MOOD_CONFIG: Record<string, { emoji: string; color: string }> = {
  Happy: { emoji: '😊', color: '#7fff00' },
  Energetic: { emoji: '⚡', color: '#ffff00' },
  Chill: { emoji: '😌', color: '#1493ff' },
  Sad: { emoji: '😢', color: '#8a2be2' },
}

// ─── Sub-Components ─────────────────────────────────────────

function ProbabilityBars({ probabilities }: { probabilities: Record<string, number> }) {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--label-color)',
        fontFamily: '"VT323", monospace',
      }}>
        PROBABILITY_DIST
      </span>
      {sorted.map(([mood, prob]) => {
        const config = MOOD_CONFIG[mood] || { emoji: '❓', color: 'var(--text-color)' }
        const percent = Math.round(prob * 100)
        return (
          <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{config.emoji}</span>
            <span style={{
              fontSize: 10,
              width: 65,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 600,
              color: 'var(--text-color)',
              opacity: 0.8,
            }}>
              {mood}
            </span>
            <div style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: 'var(--btn-bg)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${percent}%`,
                height: '100%',
                borderRadius: 4,
                background: config.color,
                transition: 'width 0.8s ease-out',
                boxShadow: `0 0 8px ${config.color}40`,
              }} />
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              width: 35,
              textAlign: 'right',
              fontFamily: '"VT323", monospace',
              color: config.color,
            }}>
              {percent}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SHAPPanel({ explanations }: { explanations: Record<string, SHAPExplanation> }) {
  const sorted = Object.entries(explanations).sort(
    ([, a], [, b]) => Math.abs(b.impact) - Math.abs(a.impact)
  )

  if (sorted.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--label-color)',
        fontFamily: '"VT323", monospace',
      }}>
        INFLUENCE_MAP
      </span>
      {sorted.map(([name, info]) => {
        const isPositive = info.direction === 'positive'
        const barColor = isPositive ? 'var(--green)' : 'var(--pink)'
        const maxImpact = Math.max(...sorted.map(([, s]) => Math.abs(s.impact)))
        const barPercent = maxImpact > 0 ? (Math.abs(info.impact) / maxImpact) * 100 : 0

        return (
          <div key={name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {isPositive
              ? <TrendingUp size={12} color={barColor} />
              : <TrendingDown size={12} color={barColor} />
            }
            <span style={{
              fontSize: 10,
              width: 100,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {name.replace(/_/g, ' ')}
            </span>
            <div style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: 'var(--btn-bg)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${barPercent}%`,
                height: '100%',
                borderRadius: 3,
                background: barColor,
                transition: 'width 0.6s ease-out',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

interface PredictionCardProps {
  prediction: MLPredictResponse | null
  loading?: boolean
}

export default function PredictionCard({ prediction, loading }: PredictionCardProps) {
  if (loading) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 200,
      }}>
        <Zap size={16} className="pulse" style={{ color: 'var(--accent-color)' }} />
        <span style={{
          fontSize: 12,
          fontFamily: '"VT323", monospace',
          letterSpacing: 2,
          color: 'var(--accent-color)',
        }}>
          NEURAL_PROCESSING...
        </span>
      </div>
    )
  }

  if (!prediction || prediction.tier !== 'ML_READY' || !prediction.prediction) {
    return null // OracleProgress handles non-ML_READY tiers
  }

  const moodConfig = MOOD_CONFIG[prediction.prediction] || { emoji: '❓', color: 'var(--text-color)' }
  const confidencePercent = Math.round((prediction.confidence || 0) * 100)

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: 16,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Zap size={14} color="var(--accent-color)" />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: '"VT323", monospace',
            color: 'var(--accent-color)',
          }}>
            NEURAL_ORACLE
          </span>
        </div>

        {/* Model version badge */}
        {prediction.modelVersion && (
          <span style={{
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 10,
            background: 'var(--btn-bg)',
            border: '1px solid var(--grid-color)',
            color: 'var(--label-color)',
            fontFamily: '"VT323", monospace',
          }}>
            v{prediction.modelVersion}
          </span>
        )}
      </div>

      {/* Prediction */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
      }}>
        <span style={{ fontSize: 48 }}>{moodConfig.emoji}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: '"Space Grotesk", sans-serif',
            color: moodConfig.color,
            textShadow: `0 0 20px ${moodConfig.color}40`,
          }}>
            {prediction.prediction}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'var(--btn-bg)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${confidencePercent}%`,
                height: '100%',
                borderRadius: 2,
                background: moodConfig.color,
              }} />
            </div>
            <span style={{
              fontSize: 10,
              fontFamily: '"VT323", monospace',
              color: 'var(--label-color)',
            }}>
              {confidencePercent}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Cycle info */}
      {prediction.cycleDay && prediction.cyclePhase && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'color-mix(in srgb, var(--pink) 10%, transparent)',
          fontSize: 10,
          fontFamily: '"Space Grotesk", sans-serif',
          color: 'var(--pink)',
        }}>
          🌙 Day {prediction.cycleDay} · {prediction.cyclePhase}
        </div>
      )}

      {/* Probability bars */}
      {prediction.probabilities && (
        <ProbabilityBars probabilities={prediction.probabilities} />
      )}

      {/* SHAP explanations */}
      {prediction.explanations && Object.keys(prediction.explanations).length > 0 && (
        <SHAPPanel explanations={prediction.explanations} />
      )}

      {/* Low confidence warning */}
      {confidencePercent < 50 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'color-mix(in srgb, var(--yellow) 10%, transparent)',
          fontSize: 10,
          color: 'var(--text-color)',
          opacity: 0.7,
        }}>
          <AlertCircle size={12} color="var(--yellow)" />
          Low confidence — more data will improve accuracy
        </div>
      )}
    </div>
  )
}
