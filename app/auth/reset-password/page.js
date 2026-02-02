'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Key, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('PASSWORDS_DO_NOT_MATCH')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            })

            if (res.ok) {
                setSuccess(true)
            } else {
                const data = await res.json()
                setError(data.error || 'RESET_FAILED')
            }
        } catch (err) {
            setError('NETWORK_ERROR')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="cyber-card" style={{ padding: '48px', textAlign: 'center', background: 'var(--card-bg)' }}>
                <ShieldCheck size={64} color="var(--green)" style={{ margin: '0 auto 24px auto' }} />
                <h2 style={{ fontWeight: '900', fontStyle: 'italic', fontSize: '1.8rem', color: 'var(--text-color)' }}>SECRET_REWRITTEN</h2>
                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginTop: '12px', color: 'var(--text-color)' }}>Your access key has been successfully updated in the core database.</p>
                <button
                    onClick={() => router.push('/auth')}
                    className="sync-btn"
                    style={{ marginTop: '32px', width: '100%', background: 'var(--text-color)', color: 'var(--bg-color)', padding: '16px' }}
                >
                    RETURN_TO_UPLINK
                </button>
            </div>
        )
    }

    return (
        <div className="cyber-card" style={{ padding: '0', background: 'var(--card-bg)', overflow: 'hidden' }}>
            <div className="cyber-header" style={{ width: '100%', background: 'var(--blue)', color: 'white', padding: '16px 20px', borderBottom: '3px solid black' }}>
                SECURITY_OVERRIDE_ACTIVE
            </div>

            <div style={{ padding: '48px' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '900', fontStyle: 'italic', margin: 0, color: 'var(--text-color)' }}>RESET SECRET</h2>
                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--label-color)', textTransform: 'uppercase', marginTop: '6px', marginBottom: '32px' }}>
                    ENTER_NEW_SECURE_SEQUENCE
                </p>

                {error && (
                    <div style={{ background: 'var(--pink)', color: 'white', padding: '12px', border: '3px solid black', fontWeight: '900', fontSize: '0.75rem', textAlign: 'center', marginBottom: '24px' }}>
                        <AlertCircle size={14} style={{ display: 'inline', marginRight: '8px' }} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label className="control-label">NEW_SECRET</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', border: '3px solid black' }}>
                            <div style={{ padding: '14px', background: 'var(--input-bg)', borderRight: '3px solid black', color: 'var(--text-color)' }}><Key size={18} /></div>
                            <input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ flex: 1, padding: '14px', border: 'none', outline: 'none', fontWeight: '800', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="control-label">VERIFY_NEW_SECRET</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', border: '3px solid black' }}>
                            <div style={{ padding: '14px', background: 'var(--input-bg)', borderRight: '3px solid black', color: 'var(--text-color)' }}><Key size={18} /></div>
                            <input
                                type="password"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ flex: 1, padding: '14px', border: 'none', outline: 'none', fontWeight: '800', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="sync-btn"
                        style={{
                            width: '100%',
                            padding: '20px',
                            marginTop: '12px',
                            background: 'var(--blue)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontSize: '1rem',
                            boxShadow: '8px 8px 0px black',
                            border: '3px solid black',
                            fontWeight: '900',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'SYNCING...' : (
                            <>
                                REWRITE_ACCESS_KEY
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {!token && (
                        <p style={{ color: 'var(--pink)', fontSize: '0.7rem', fontWeight: '900', marginTop: '12px', textAlign: 'center' }}>
                            ERROR: NO_SECURITY_TOKEN_DETECTED
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Logo width={280} height={100} />
                </div>
                <Suspense fallback={<div>LOAD_SECURITY_MODULE...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
