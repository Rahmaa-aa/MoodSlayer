'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Zap, Shield, Key, User, Edit3, ArrowRight, Sparkles, Heart, Activity, Target } from 'lucide-react'

export default function AuthPage() {
    const [mode, setMode] = useState('signin') // 'signin' or 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const err = searchParams.get('error')
        if (err) setError('AUTH_ERROR: ACCESS_DENIED')

        const success = searchParams.get('success')
        if (success) {
            setMode('signin')
        }
    }, [searchParams])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        if (res?.error) {
            setError('INVALID_CREDENTIALS')
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('PASSWORDS_DO_NOT_MATCH')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })

            const data = await res.json()

            if (res.ok) {
                await signIn('credentials', {
                    email,
                    password,
                    callbackUrl: '/',
                })
            } else {
                setError(data.error?.toUpperCase() || 'SIGNUP_FAILED')
                setLoading(false)
            }
        } catch (err) {
            setError('NETWORK_ERROR')
            setLoading(false)
        }
    }

    return (
        <div className="landing-container" style={{
            minHeight: '100vh',
            width: '100%',
            padding: '60px 32px 100px 32px', // Large bottom padding to prevent shadow/border cutoff
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start', // Start from top to prevent clipping during centering
            position: 'relative',
            zIndex: 10,
            overflowX: 'hidden',
            overflowY: 'auto'
        }}>
            <div className="bento-grid" style={{
                margin: 'auto 0', // Vertical auto margin centers the content if there is extra space
                display: 'grid',
                gridTemplateColumns: 'minmax(400px, 1.2fr) 450px',
                gap: '32px',
                width: '100%',
                maxWidth: '1200px',
                alignItems: 'stretch'
            }}>
                {/* BRAND BENTO BOX */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="cyber-card" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '48px',
                        paddingBottom: '24px', // Reduced bottom padding to accommodate the blue bar
                        position: 'relative',
                        background: 'white',
                        overflow: 'hidden' // Ensure the blue footer doesn't spill out
                    }}>
                        <div className="cyber-header" style={{ position: 'absolute', top: '24px', left: '24px' }}>CORE_VIBE_SYSTEM</div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <Logo width={120} height={120} />
                                <h1 style={{ fontSize: '3.5rem', fontWeight: '900', fontStyle: 'italic', lineHeight: 0.8, textTransform: 'uppercase', color: 'black', margin: 0 }}>
                                    MOOD<br /><span style={{ color: 'var(--pink)' }}>SLAYER</span>
                                </h1>
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <p style={{ fontSize: '1.4rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.1 }}>
                                    MASTER YOUR PATTERNS.<br />SLAY YOUR VIBES.
                                </p>
                                <p style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.6, marginTop: '12px', maxWidth: '420px', lineHeight: 1.4 }}>
                                    The neural hub for your daily life. Track, predict, and optimize your world with absolute precision.
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                            <div className="tag-badge"><Activity size={14} /> ANALYTICS</div>
                            <div className="tag-badge"><Target size={14} /> PREDICTIONS</div>
                            <div className="tag-badge"><Zap size={14} /> MOTIVATION</div>
                        </div>

                        {/* INTEGRATED ACCENT BANNER (formerly the "Blue Part") */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'var(--blue)',
                            color: 'white',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            borderTop: '3px solid black'
                        }}>
                            <Sparkles size={18} color="var(--yellow)" />
                            <p style={{ fontWeight: '900', margin: 0, fontSize: '0.75rem', letterSpacing: '1px' }}>
                                UPGRADE_YOUR_EXISTENCE <span style={{ opacity: 0.7, fontWeight: '500', marginLeft: '8px' }}>START_NEURAL_JOURNEY_IN_30S</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* AUTH BENTO BOX */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="cyber-card" style={{ padding: 0, overflow: 'visible', width: '100%', position: 'relative', background: 'white' }}>
                        <div className="cyber-header" style={{
                            width: '100%',
                            background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                            color: 'white',
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: 0,
                            borderBottom: '3px solid black'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', fontSize: '0.75rem', fontFamily: "'Press Start 2P', cursive" }}>
                                <Zap size={16} /> {mode === 'signin' ? 'UPLINK_INITIALIZED' : 'ENROLLMENT_ACTIVE'}
                            </div>
                        </div>

                        <div style={{ padding: '32px 32px', paddingBottom: '32px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'black', lineHeight: 1 }}>
                                    {mode === 'signin' ? 'LOGIN' : 'SIGN UP'}
                                </h2>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#666', textTransform: 'uppercase', marginTop: '6px' }}>
                                    {mode === 'signin' ? 'IDENTIFY_YOURSELF' : 'JOIN_THE_MATRIX'}
                                </p>
                            </div>

                            {error && (
                                <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center', marginBottom: '24px' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={mode === 'signin' ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {mode === 'signup' && (
                                    <div>
                                        <label className="control-label">USER_NAME</label>
                                        <div className="input-field">
                                            <div className="input-icon"><Edit3 size={18} /></div>
                                            <input
                                                type="text"
                                                placeholder="Resident Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="control-label">CORP_EMAIL</label>
                                    <div className="input-field">
                                        <div className="input-icon"><User size={18} /></div>
                                        <input
                                            type="email"
                                            placeholder="user@neural.lnk"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="control-label">ACCESS_SECRET</label>
                                    <div className="input-field">
                                        <div className="input-icon"><Key size={18} /></div>
                                        <input
                                            type="password"
                                            placeholder="********"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {mode === 'signup' && (
                                    <div>
                                        <label className="control-label">VERIFY_SECRET</label>
                                        <div className="input-field">
                                            <div className="input-icon"><Key size={18} /></div>
                                            <input
                                                type="password"
                                                placeholder="********"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="sync-btn"
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        marginTop: '12px',
                                        background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        fontSize: '1rem',
                                        boxShadow: '8px 8px 0px black'
                                    }}
                                >
                                    {loading ? 'PROCESSING...' : (
                                        <>
                                            {mode === 'signin' ? 'START UPLINK' : 'CREATE ACCOUNT'}
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: '900', margin: 0 }}>
                                    {mode === 'signin' ? 'FIRST_TIME_HERE?' : 'ALREADY_HAVE_SECRET?'}
                                    <button
                                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: mode === 'signin' ? 'var(--blue)' : 'var(--pink)',
                                            fontWeight: '900',
                                            cursor: 'pointer',
                                            marginLeft: '8px',
                                            textDecoration: 'underline',
                                            fontFamily: 'inherit',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {mode === 'signin' ? 'REGISTER' : 'LOG_IN'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .landing-container {
                    font-family: 'Space Grotesk', sans-serif;
                }
                .tag-badge {
                    background: #f1f5f9;
                    border: 2px solid black;
                    padding: 8px 14px;
                    font-size: 0.75rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .input-field {
                    display: flex;
                    align-items: center;
                    border: 3px solid black;
                    background: white;
                    transition: transform 0.1s ease;
                }
                .input-field:focus-within {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px black;
                }
                .input-icon {
                    padding: 14px;
                    background: #f8fafc;
                    border-right: 3px solid black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                input {
                    flex: 1;
                    border: none;
                    padding: 14px;
                    outline: none;
                    font-weight: 800;
                    font-size: 1rem;
                    font-family: inherit;
                }
                @media (max-width: 900px) {
                    .landing-container { padding: 40px 20px 80px 20px; }
                    .bento-grid {
                        grid-template-columns: 1fr !important;
                        max-width: 500px;
                    }
                }
            `}</style>
        </div>
    )
}
