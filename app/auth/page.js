'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Zap, Shield, Key, User, Edit3, ArrowRight, Sparkles, Heart } from 'lucide-react'

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
            // Add a small success message logic if needed
        }
    }, [searchParams])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false, // Handle manually for smoother transition
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
                // Auto login after signup for best UX
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
        <div className="landing-wrapper" style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'white',
            overflow: 'hidden'
        }}>
            {/* LEFT SIDE: BRANDING */}
            <div className="branding-section" style={{
                flex: 1.2,
                background: 'black',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Memphis/Cyber elements */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--blue)', opacity: 0.2, filter: 'blur(100px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--pink)', opacity: 0.2, filter: 'blur(80px)' }}></div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <Logo width={120} height={120} className="glow-logo" />

                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', fontStyle: 'italic', lineHeight: 0.9, marginTop: '32px', textTransform: 'uppercase' }}>
                        MOOD<br /><span style={{ color: 'var(--yellow)' }}>SLAYER</span>
                    </h1>

                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', maxWidth: '500px', opacity: 0.9 }}>
                            <span style={{ color: 'var(--green)' }}># NoCap</span> Tracking for your Neural Vibe Matrix.
                            Predicting your next move before you even make it. 🦾✨
                        </p>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div className="badge">MAIN_CHARACTER_ENERGY</div>
                            <div className="badge">PATTERN_SLAYER</div>
                            <div className="badge">NEURAL_DUMP</div>
                        </div>
                    </div>
                </div>

                {/* Footer text */}
                <div style={{ position: 'absolute', bottom: '40px', left: '80px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.4 }}>
                    <Shield size={16} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '2px' }}>V_5.4 // ENCRYPTED_VIBES_ONLY</span>
                </div>
            </div>

            {/* RIGHT SIDE: AUTH FORM */}
            <div className="form-section" style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: '#f8fafc'
            }}>
                <div className="cyber-card" style={{ width: '100%', maxWidth: '450px', background: 'white', padding: '0', overflow: 'hidden' }}>
                    <div className="cyber-header" style={{
                        background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                        color: 'white',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900' }}>
                            <Zap size={20} /> {mode === 'signin' ? 'UPLINK_INITIALIZED' : 'NEW_RESIDENT_ENROLLMENT'}
                        </div>
                        <Sparkles size={18} />
                    </div>

                    <div style={{ padding: '40px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'black' }}>
                                {mode === 'signin' ? 'LOGIN' : 'JOIN_US'}
                            </h2>
                            <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#666' }}>
                                {mode === 'signin' ? 'ENTER_CREDENTIALS_FOR_ACCESS' : 'BEGIN_YOUR_NEURAL_JOURNEY'}
                            </p>
                        </div>

                        {error && (
                            <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center', marginBottom: '24px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={mode === 'signin' ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {mode === 'signup' && (
                                <div>
                                    <label className="control-label">RESIDENT_NAME</label>
                                    <div className="input-with-icon">
                                        <div className="input-icon"><Edit3 size={18} /></div>
                                        <input
                                            type="text"
                                            placeholder="Who are you?"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="control-label">USER_EMAIL</label>
                                <div className="input-with-icon">
                                    <div className="input-icon"><User size={18} /></div>
                                    <input
                                        type="email"
                                        placeholder="email@uplink.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="control-label">ACCESS_KEY</label>
                                <div className="input-with-icon">
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
                                    <label className="control-label">CONFIRM_KEY</label>
                                    <div className="input-with-icon">
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
                                    padding: '16px',
                                    marginTop: '10px',
                                    background: mode === 'signin' ? 'var(--pink)' : 'var(--blue)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px'
                                }}
                            >
                                {loading ? 'PROCESSING...' : (
                                    <>
                                        {mode === 'signin' ? 'INITIATE UPLINK' : 'CREATE ACCOUNT'}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '900' }}>
                                {mode === 'signin' ? 'NEW_HERE?' : 'ALREADY_HAVE_ACCESS?'}
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
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    {mode === 'signin' ? 'ENROLL_NOW' : 'LOG_IN_HERE'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .landing-wrapper {
                    font-family: 'Inter', sans-serif;
                }
                .badge {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 6px 12px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                }
                .input-with-icon {
                    display: flex;
                    align-items: center;
                    border: 3px solid black;
                    background: white;
                    transition: transform 0.2s ease;
                }
                .input-with-icon:focus-within {
                    transform: translate(-2px, -2px);
                    box-shadow: 4px 4px 0px black;
                }
                .input-icon {
                    padding: 12px;
                    background: #f1f5f9;
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
                    font-weight: bold;
                    font-size: 1rem;
                }
                .glow-logo {
                    filter: drop-shadow(0 0 15px rgba(255,255,255,0.3));
                }
            `}</style>
        </div>
    )
}
