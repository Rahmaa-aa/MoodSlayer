'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Shield, Key, User } from 'lucide-react'

export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Handle errors from URL if redirected back
    useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('error')) {
                setError('INVALID_CREDENTIALS: ACCESS_DENIED')
            }
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Using default redirect: true helps browsers detect successful login
        await signIn('credentials', {
            email,
            password,
            callbackUrl: '/',
        })
    }

    return (
        <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7ff' }}>
            <div className="cyber-card" style={{ width: '400px', padding: 0, overflow: 'hidden' }}>
                <div className="cyber-header" style={{ width: '100%', background: 'var(--pink)', color: 'white', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Shield size={24} /> SIGN IN
                </div>

                <form
                    method="POST"
                    onSubmit={handleSubmit}
                    style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'black' }}>LOGIN</h2>
                        <p style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>MOODSLAYER_SYSTEM_V5.4</p>
                    </div>

                    {error && (
                        <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="control-label">USER_EMAIL</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '3px solid black', background: 'white' }}>
                            <div style={{ padding: '10px', background: '#eee', borderRight: '3px solid black' }}><User size={18} /></div>
                            <input
                                name="email"
                                id="email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ flex: 1, border: 'none', padding: '10px', outline: 'none', fontWeight: 'bold' }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="control-label">ACCESS_KEY</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '3px solid black', background: 'white' }}>
                            <div style={{ padding: '10px', background: '#eee', borderRight: '3px solid black' }}><Key size={18} /></div>
                            <input
                                name="password"
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ flex: 1, border: 'none', padding: '10px', outline: 'none', fontWeight: 'bold' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="sync-btn"
                        style={{ padding: '12px', marginTop: '10px' }}
                    >
                        {loading ? 'AUTHENTICATING...' : 'LOG IN'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '900' }}>
                            NEW_USER? <Link href="/auth/signup" style={{ color: 'var(--blue)', textDecoration: 'none' }}>SIGN_UP_HERE</Link>
                        </p>
                    </div>
                </form>

            </div>
        </div>
    )
}
