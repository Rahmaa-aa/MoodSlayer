'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Shield, Key, User, Edit3 } from 'lucide-react'

export default function SignUpPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e) => {
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
                router.push('/auth/signin?success=1')
            } else {
                setError(data.error.toUpperCase() || 'REGISTRATION_FAILED')
            }
        } catch (err) {
            setError('NETWORK_ERROR: UPLINK_FAILED')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f7ff' }}>
            <div className="cyber-card" style={{ width: '400px', padding: 0, overflow: 'hidden' }}>
                <div className="cyber-header" style={{ width: '100%', background: 'var(--blue)', color: 'white', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Shield size={24} /> SIGN UP
                </div>

                <form
                    method="POST"
                    onSubmit={handleSubmit}
                    style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'black' }}>SIGN UP</h2>
                        <p style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>NEW_RESIDENT_ENROLLMENT</p>
                    </div>

                    {error && (
                        <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="control-label">YOUR_NAME</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '3px solid black', background: 'white' }}>
                            <div style={{ padding: '10px', background: '#eee', borderRight: '3px solid black' }}><Edit3 size={18} /></div>
                            <input
                                name="name"
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ flex: 1, border: 'none', padding: '10px', outline: 'none', fontWeight: 'bold' }}
                                required
                            />
                        </div>
                    </div>

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
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ flex: 1, border: 'none', padding: '10px', outline: 'none', fontWeight: 'bold' }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="control-label">CONFIRM_ACCESS_KEY</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '3px solid black', background: 'white' }}>
                            <div style={{ padding: '10px', background: '#eee', borderRight: '3px solid black' }}><Key size={18} /></div>
                            <input
                                name="confirmPassword"
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ flex: 1, border: 'none', padding: '10px', outline: 'none', fontWeight: 'bold' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="sync-btn"
                        style={{ padding: '12px', marginTop: '10px', background: 'var(--blue)', color: 'white' }}
                    >
                        {loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '900' }}>
                            ALREADY_REGISTERED? <Link href="/auth/signin" style={{ color: 'var(--pink)', textDecoration: 'none' }}>SIGN_IN_HERE</Link>
                        </p>
                    </div>
                </form>

            </div>
        </div>
    )
}
