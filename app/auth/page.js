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
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10
        }}>
            <div className="bento-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(400px, 1fr) 450px',
                gap: '32px',
                width: '100%',
                maxWidth: '1200px',
            }}>
                {/* BRAND BENTO BOX */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="cyber-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', position: 'relative' }}>
                        <div className="cyber-header" style={{ position: 'absolute', top: '24px', left: '24px' }}>CORE_VIBE_SYSTEM</div>

                        <div style={{ marginTop: '24px' }}>
                            <Logo width={220} height={220} />

                            <h1 style={{ fontSize: '4.5rem', fontWeight: '900', fontStyle: 'italic', lineHeight: 0.9, marginTop: '24px', textTransform: 'uppercase', color: 'black' }}>
                                MOOD<br /><span style={{ color: 'var(--pink)' }}>SLAYER</span>
                            </h1>

                            <div style={{ marginTop: '32px' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.2 }}>
                                    MASTER YOUR PATTERNS.<br />SLAY YOUR VIBES.
                                </p>
                                <p style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.6, marginTop: '16px', maxWidth: '400px' }}>
                                    The neural hub for your daily life. Track, predict, and optimize your world with absolute precision.
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                            <div className="tag-badge"><Activity size={14} /> ANALYTICS</div>
                            <div className="tag-badge"><Target size={14} /> PREDICTIONS</div>
                            <div className="tag-badge"><Zap size={14} /> MOTIVATION</div>
                        </div>
                    </div>

                    <div className="cyber-card" style={{ padding: '24px', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'black', padding: '12px', borderRadius: '4px' }}><Sparkles size={24} color="var(--yellow)" /></div>
                        <div>
                            <p style={{ fontWeight: '900', margin: 0, fontSize: '0.8rem' }}>UPGRADE_YOUR_EXISTENCE</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>Start your neural journey in 30 seconds.</p>
                        </div>
                    </div>
                </div>

                {/* AUTH BENTO BOX */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="cyber-card" style={{ padding: 0, overflow: 'hidden', width: '100%', position: 'relative', boxShadow: '8px 8px 0px rgba(0,0,0,0.05)' }}>
                        <div className="cyber-header" style={{
                            width: '100%',
                            background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                            color: 'white',
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', fontSize: '0.7rem', fontFamily: "'Press Start 2P', cursive" }}>
                                <Zap size={16} /> {mode === 'signin' ? 'UPLINK_INITIALIZED' : 'ENROLLMENT_ACTIVE'}
                            </div>
                        </div>

                        <div style={{ padding: '40px', paddingBottom: '60px' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'black' }}>
                                    {mode === 'signin' ? 'LOGIN' : 'SIGN UP'}
                                </h2>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#666', textTransform: 'uppercase' }}>
                                    {mode === 'signin' ? 'IDENTIFY_YOURSELF' : 'JOIN_THE_MATRIX'}
                                </p>
                            </div>

                            {error && (
                                <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center', marginBottom: '24px' }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={mode === 'signin' ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {mode === 'signup' && (
                                    <div>
                                        <label className="control-label">USER_NAME</label>
                                        <div className="input-field">
                                            <div className="input-icon"><Edit3 size={18} /></div>
                                            <input
                                                type="text"
                                                placeholder="What should we call you?"
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
                                        marginTop: '8px',
                                        background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        fontSize: '1rem',
                                        boxShadow: '6px 6px 0px black'
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

                            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: '900' }}>
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
                    padding: 6px 12px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
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
                    box-shadow: 3px 3px 0px black;
                }
                .input-icon {
                    padding: 12px;
                    background: #f8fafc;
                    border-right: 3px solid black;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                input {
                    flex: 1;
                    border: none;
                    padding: 12px;
                    outline: none;
                    font-weight: 800;
                    font-size: 1rem;
                    font-family: inherit;
                }
                @media (max-width: 900px) {
                    .bento-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    )
}
