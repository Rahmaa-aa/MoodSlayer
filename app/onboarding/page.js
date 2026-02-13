'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useUser } from '@/context/UserContext'
import { Logo } from '@/components/Logo'
import { ArrowRight, ArrowLeft, Sparkles, Target, Zap, Heart, Moon, Check, SkipForward } from 'lucide-react'

const GOALS = [
    { id: 'mood', label: 'MOOD', icon: Heart, color: 'var(--pink)', desc: 'Track & predict your daily vibe' },
    { id: 'energy', label: 'ENERGY', icon: Zap, color: 'var(--yellow)', desc: 'Optimize your energy levels' },
    { id: 'productivity', label: 'PRODUCTIVITY', icon: Target, color: 'var(--blue)', desc: 'Maximize your output' },
    { id: 'all', label: 'ALL', icon: Sparkles, color: 'var(--green)', desc: 'Full neural optimization' },
]

export default function OnboardingPage() {
    const { data: session, status } = useSession()
    const { refreshStats } = useUser()
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [saving, setSaving] = useState(false)

    // Form state
    const [displayName, setDisplayName] = useState('')
    const [primaryGoal, setPrimaryGoal] = useState('mood')
    const [tracksCycle, setTracksCycle] = useState(false)
    const [cycleLength, setCycleLength] = useState(28)
    const [lastPeriodStart, setLastPeriodStart] = useState('')

    // Pre-fill name from session
    useEffect(() => {
        if (session?.user?.name) {
            setDisplayName(session.user.name)
        }
    }, [session])

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth')
        }
    }, [status, router])

    const handleFinish = async () => {
        setSaving(true)
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: displayName.trim() || session?.user?.name || 'Slayer',
                    primaryGoal,
                    tracksCycle,
                    cycleLength: tracksCycle ? cycleLength : 28,
                    lastPeriodStart: tracksCycle && lastPeriodStart ? lastPeriodStart : null,
                    timezone
                })
            })
            // Refresh UserContext so home page sees onboardingComplete: true
            await refreshStats()
            router.push('/')
        } catch (e) {
            console.error('Onboarding save failed:', e)
            router.push('/')
        }
    }

    const handleSkip = () => {
        if (step < 2) {
            setStep(step + 1)
        } else {
            handleFinish()
        }
    }

    if (status === 'loading') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="cyber-header" style={{ fontSize: '1rem' }}>INITIALIZING...</div>
            </div>
        )
    }

    return (
        <div style={{
            width: '100%',
            maxWidth: '560px',
            padding: '32px 24px',
            margin: '0 auto'
        }}>
            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        flex: 1,
                        height: '6px',
                        background: i <= step ? 'var(--pink)' : '#e2e8f0',
                        border: '2px solid black',
                        transition: 'background 0.3s ease'
                    }} />
                ))}
            </div>

            {/* Step indicator */}
            <div className="cyber-header" style={{ marginBottom: '8px', fontSize: '0.65rem' }}>
                ONBOARDING_SEQUENCE [{step + 1}/3]
            </div>

            {/* === STEP 0: NAME === */}
            {step === 0 && (
                <div className="cyber-card" style={{ padding: '40px 32px', background: 'white' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Logo width={200} height={80} />
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        margin: '0 0 8px 0',
                        lineHeight: 1.1
                    }}>
                        WHAT SHOULD WE CALL YOU?
                    </h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '600', marginBottom: '24px' }}>
                        This is how your Oracle will address you.
                    </p>

                    <label className="control-label">DISPLAY_NAME</label>
                    <div className="input-field" style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '3px solid black',
                        background: 'white',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            padding: '14px',
                            background: '#f8fafc',
                            borderRight: '3px solid black',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Sparkles size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Your name, Slayer"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={{
                                flex: 1,
                                border: 'none',
                                padding: '14px',
                                outline: 'none',
                                fontWeight: '800',
                                fontSize: '1rem',
                                fontFamily: 'inherit'
                            }}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleSkip}
                            className="sync-btn"
                            style={{
                                padding: '16px 20px',
                                background: 'white',
                                color: 'black',
                                border: '3px solid black',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem'
                            }}
                        >
                            <SkipForward size={16} /> SKIP
                        </button>
                        <button
                            onClick={() => setStep(1)}
                            className="sync-btn"
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'var(--pink)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                boxShadow: '6px 6px 0px black'
                            }}
                        >
                            NEXT <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* === STEP 1: GOAL === */}
            {step === 1 && (
                <div className="cyber-card" style={{ padding: '40px 32px', background: 'white' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        margin: '0 0 8px 0',
                        lineHeight: 1.1
                    }}>
                        WHAT DO YOU WANT TO SLAY?
                    </h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '600', marginBottom: '24px' }}>
                        This helps your Oracle focus its predictions.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {GOALS.map(goal => {
                            const Icon = goal.icon
                            const isSelected = primaryGoal === goal.id
                            return (
                                <button
                                    key={goal.id}
                                    onClick={() => setPrimaryGoal(goal.id)}
                                    className="sync-btn"
                                    style={{
                                        padding: '16px 20px',
                                        background: isSelected ? goal.color : 'white',
                                        color: isSelected ? 'white' : 'black',
                                        border: '3px solid black',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: '900',
                                        boxShadow: isSelected ? '6px 6px 0px black' : '3px 3px 0px black',
                                        transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'left',
                                        width: '100%'
                                    }}
                                >
                                    <Icon size={20} />
                                    <div style={{ flex: 1 }}>
                                        <div>{goal.label}</div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            opacity: isSelected ? 0.8 : 0.5,
                                            marginTop: '2px'
                                        }}>
                                            {goal.desc}
                                        </div>
                                    </div>
                                    {isSelected && <Check size={18} strokeWidth={4} />}
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setStep(0)}
                            className="sync-btn"
                            style={{
                                padding: '16px 20px',
                                background: 'white',
                                color: 'black',
                                border: '3px solid black',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem'
                            }}
                        >
                            <ArrowLeft size={16} /> BACK
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className="sync-btn"
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'var(--blue)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                boxShadow: '6px 6px 0px black'
                            }}
                        >
                            NEXT <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* === STEP 2: CYCLE TRACKING === */}
            {step === 2 && (
                <div className="cyber-card" style={{ padding: '40px 32px', background: 'white' }}>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        margin: '0 0 8px 0',
                        lineHeight: 1.1
                    }}>
                        TRACK YOUR BODY&apos;S RHYTHM? 🌙
                    </h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '600', marginBottom: '24px' }}>
                        Menstrual cycle tracking boosts prediction accuracy by 10-25%.
                        Completely optional — you can always enable this in Settings later.
                    </p>

                    {/* Toggle */}
                    <button
                        onClick={() => setTracksCycle(!tracksCycle)}
                        className="sync-btn"
                        style={{
                            width: '100%',
                            padding: '20px',
                            background: tracksCycle ? 'var(--pink)' : 'white',
                            color: tracksCycle ? 'white' : 'black',
                            border: '3px solid black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.95rem',
                            fontWeight: '900',
                            boxShadow: tracksCycle ? '6px 6px 0px black' : '3px 3px 0px black',
                            marginBottom: tracksCycle ? '24px' : '24px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Moon size={20} />
                            BODY RHYTHM TRACKING
                        </div>
                        <div style={{
                            width: '48px',
                            height: '26px',
                            borderRadius: '13px',
                            background: tracksCycle ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                            border: '2px solid ' + (tracksCycle ? 'rgba(255,255,255,0.5)' : 'black'),
                            position: 'relative',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: tracksCycle ? 'white' : '#94a3b8',
                                position: 'absolute',
                                top: '2px',
                                left: tracksCycle ? '24px' : '2px',
                                transition: 'left 0.2s ease'
                            }} />
                        </div>
                    </button>

                    {/* Conditional cycle fields */}
                    {tracksCycle && (
                        <div style={{
                            border: '3px solid black',
                            padding: '24px',
                            background: '#fef2f2',
                            marginBottom: '24px'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label className="control-label">LAST_PERIOD_START</label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '3px solid black',
                                    background: 'white'
                                }}>
                                    <div style={{
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRight: '3px solid black',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Heart size={16} color="var(--pink)" />
                                    </div>
                                    <input
                                        type="date"
                                        value={lastPeriodStart}
                                        onChange={(e) => setLastPeriodStart(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            padding: '12px',
                                            outline: 'none',
                                            fontWeight: '700',
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="control-label">
                                    CYCLE_LENGTH: {cycleLength} DAYS
                                </label>
                                <input
                                    type="range"
                                    min={18}
                                    max={90}
                                    value={cycleLength}
                                    onChange={(e) => setCycleLength(parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        accentColor: 'var(--pink)',
                                        height: '8px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    opacity: 0.5
                                }}>
                                    <span>18 DAYS</span>
                                    <span>28 (AVG)</span>
                                    <span>90 DAYS</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setStep(1)}
                            className="sync-btn"
                            style={{
                                padding: '16px 20px',
                                background: 'white',
                                color: 'black',
                                border: '3px solid black',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem'
                            }}
                        >
                            <ArrowLeft size={16} /> BACK
                        </button>
                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            className="sync-btn"
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'var(--green)',
                                color: 'black',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                fontWeight: '900',
                                boxShadow: '6px 6px 0px black'
                            }}
                        >
                            {saving ? 'SAVING...' : (
                                <>
                                    LAUNCH ORACLE <Sparkles size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .cyber-card {
                    animation: fadeIn 0.3s ease;
                }
            `}</style>
        </div>
    )
}
