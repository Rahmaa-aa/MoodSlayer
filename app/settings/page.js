'use client'
import { useState, useEffect } from 'react'
import { Settings, Shield, Palette, Zap, User, Key, Save, AlertCircle, CheckCircle2, Moon, Sun, Monitor, RefreshCcw, Heart } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useSession } from 'next-auth/react'
import { Notifications, showToast } from '../../components/Notifications'

export default function SettingsPage() {
    const { userStats, setUserStats, theme, changeTheme, refreshStats } = useUser()
    const { data: session, update: updateSession } = useSession()
    const [mounted, setMounted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form States
    const [newName, setNewName] = useState('')
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Cycle tracking state
    const [tracksCycle, setTracksCycle] = useState(false)
    const [cycleLength, setCycleLength] = useState(28)
    const [lastPeriodStart, setLastPeriodStart] = useState('')
    const [cycleSaving, setCycleSaving] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (session?.user?.name) {
            setNewName(session.user.name)
        }
        // Initialize cycle fields from userStats
        if (userStats) {
            setTracksCycle(userStats.tracksCycle || false)
            setCycleLength(userStats.cycleLength || 28)
            if (userStats.lastPeriodStart) {
                setLastPeriodStart(new Date(userStats.lastPeriodStart).toISOString().split('T')[0])
            }
        }
    }, [session, userStats])

    const handleSaveCycle = async () => {
        setCycleSaving(true)
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tracksCycle,
                    cycleLength: tracksCycle ? cycleLength : 28,
                    lastPeriodStart: tracksCycle && lastPeriodStart ? lastPeriodStart : null,
                    timezone
                })
            })
            if (res.ok) {
                showToast('RHYTHM_SETTINGS_SYNCED', 'success')
                refreshStats()
            } else {
                showToast('SYNC_FAILED', 'error')
            }
        } catch (e) {
            showToast('NETWORK_ERROR', 'error')
        } finally {
            setCycleSaving(false)
        }
    }

    const handleUpdateName = async () => {
        setIsSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('NAME_UPDATED_SYNCED')
                showToast('IDENTITY_UPDATED', 'success')
                updateSession({ name: newName })
            } else {
                setError(data.error || 'UPDATE_FAILED')
            }
        } catch (e) {
            setError('NETWORK_FAILURE')
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (passwords.next !== passwords.confirm) {
            setError('PASSWORDS_DO_NOT_MATCH')
            return
        }
        setIsSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.next
                })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('PASSWORD_SECURED')
                showToast('SECURITY_UPGRADED', 'success')
                setPasswords({ current: '', next: '', confirm: '' })
            } else {
                setError(data.error || 'PASSWORD_CHANGE_FAILED')
            }
        } catch (e) {
            setError('NETWORK_FAILURE')
        } finally {
            setIsSaving(false)
        }
    }

    if (!mounted) return null

    const isGoogleUser = session?.user?.email && !session?.user?.id?.includes('-') && !session?.user?.image?.includes('googleusercontent') === false

    return (
        <div className="page-container">
            <Notifications />
            <header className="dashboard-header">
                <div className="header-title-group">
                    <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>CONFIGURATION // ACCESS_GRANTED</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>USER_COMMAND_CENTER</h2>
                </div>
            </header>

            <div className="dashboard-row" style={{ marginTop: '32px' }}>
                {/* LEFT: ACCOUNT & SECURITY */}
                <div className="col-left" style={{ gap: '32px' }}>

                    {/* IDENTITY MODULE */}
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ background: 'var(--blue)', color: 'white' }}>Identity_Node</div>
                        <div style={{ padding: '8px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label className="control-label">Personnel Name</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        className="sidebar-btn"
                                        style={{ cursor: 'text', flex: 1, fontSize: '1rem', background: 'var(--input-bg)' }}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Enter name..."
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={isSaving || newName === session?.user?.name}
                                        className="sidebar-btn"
                                        style={{ width: 'auto', background: 'var(--text-color)', color: 'var(--bg-color)', opacity: (isSaving || newName === session?.user?.name) ? 0.5 : 1 }}
                                    >
                                        <Save size={16} /> SYNC
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '12px', background: 'var(--bg-color)', border: '1px dashed var(--label-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <User size={16} opacity={0.5} />
                                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                    <span style={{ fontWeight: '900' }}>CORE_ID:</span> {session?.user?.email}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECURITY MODULE */}
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ background: 'var(--pink)', color: 'white' }}>Security_Shield</div>
                        <div style={{ padding: '8px' }}>
                            {isGoogleUser ? (
                                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-color)', border: '2px solid black' }}>
                                    <Monitor size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p style={{ fontWeight: '900', fontSize: '0.8rem', margin: 0 }}>EXTERNAL_AUTH_DETECTED</p>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '4px' }}>Password management is handled by Google.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label className="control-label">Current Access Key</label>
                                        <input
                                            type="password"
                                            className="sidebar-btn"
                                            style={{ cursor: 'text', width: '100%', background: 'var(--input-bg)' }}
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label className="control-label">New Sequence</label>
                                            <input
                                                type="password"
                                                className="sidebar-btn"
                                                style={{ cursor: 'text', width: '100%', background: 'var(--input-bg)' }}
                                                value={passwords.next}
                                                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="control-label">Confirm Sequence</label>
                                            <input
                                                type="password"
                                                className="sidebar-btn"
                                                style={{ cursor: 'text', width: '100%', background: 'var(--input-bg)' }}
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={isSaving || !passwords.current || !passwords.next}
                                        className="sidebar-btn"
                                        style={{ background: 'var(--pink)', color: 'white', border: '3px solid black', justifyContent: 'center' }}
                                    >
                                        <RefreshCcw size={16} className={isSaving ? 'spin-slow' : ''} /> REWRITE_SECURITY_HASH
                                    </button>
                                </div>
                            )}

                            {(error || success) && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: error ? 'var(--pink)' : 'var(--green)',
                                    color: error ? 'white' : 'black',
                                    border: '2px solid black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: '900',
                                    fontSize: '0.7rem'
                                }}>
                                    {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                    {error || success}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* BODY RHYTHM MODULE */}
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ background: 'var(--pink)', color: 'white' }}>Body_Rhythm</div>
                        <div style={{ padding: '8px' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: '900', marginBottom: '16px', opacity: 0.6 }}>CYCLE_TRACKING_ENGINE — BOOSTS ML ACCURACY BY 10-25%</p>

                            {/* Toggle */}
                            <button
                                onClick={() => setTracksCycle(!tracksCycle)}
                                className="sidebar-btn"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    justifyContent: 'space-between',
                                    background: tracksCycle ? 'var(--pink)' : 'var(--btn-bg)',
                                    color: tracksCycle ? 'white' : 'var(--text-color)',
                                    marginBottom: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Moon size={16} />
                                    BODY_RHYTHM_TRACKING
                                </div>
                                <div style={{
                                    width: '40px',
                                    height: '22px',
                                    borderRadius: '11px',
                                    background: tracksCycle ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                                    border: '2px solid ' + (tracksCycle ? 'rgba(255,255,255,0.5)' : 'black'),
                                    position: 'relative',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: tracksCycle ? 'white' : '#94a3b8',
                                        position: 'absolute',
                                        top: '2px',
                                        left: tracksCycle ? '20px' : '2px',
                                        transition: 'left 0.2s ease'
                                    }} />
                                </div>
                            </button>

                            {tracksCycle && (
                                <div style={{ border: '2px solid var(--label-color)', padding: '16px', marginBottom: '16px', background: 'var(--bg-color)' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label className="control-label">LAST_PERIOD_START</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '2px solid black', background: 'var(--input-bg)' }}>
                                            <div style={{ padding: '10px', borderRight: '2px solid black', display: 'flex', alignItems: 'center' }}>
                                                <Heart size={14} color="var(--pink)" />
                                            </div>
                                            <input
                                                type="date"
                                                value={lastPeriodStart}
                                                onChange={(e) => setLastPeriodStart(e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    flex: 1,
                                                    border: 'none',
                                                    padding: '10px',
                                                    outline: 'none',
                                                    fontWeight: '700',
                                                    fontSize: '0.85rem',
                                                    fontFamily: 'inherit',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="control-label">CYCLE_LENGTH (DAYS)</label>
                                        <input
                                            type="number"
                                            min={18}
                                            max={90}
                                            value={cycleLength}
                                            onChange={(e) => setCycleLength(e.target.value)}
                                            onBlur={() => {
                                                const n = parseInt(cycleLength) || 28
                                                setCycleLength(Math.max(18, Math.min(90, n)))
                                            }}
                                            className="sidebar-btn"
                                            style={{
                                                width: '100%',
                                                cursor: 'text',
                                                background: 'var(--input-bg)',
                                                fontSize: '1rem',
                                                fontWeight: '800'
                                            }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: '700', opacity: 0.5, marginTop: '4px' }}>
                                            <span>18–90 days supported</span>
                                            <span>Irregular? Just log each period when it starts.</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSaveCycle}
                                disabled={cycleSaving}
                                className="sidebar-btn"
                                style={{ width: '100%', background: 'var(--text-color)', color: 'var(--bg-color)', justifyContent: 'center', opacity: cycleSaving ? 0.5 : 1 }}
                            >
                                <Save size={14} /> {cycleSaving ? 'SYNCING...' : 'SYNC_RHYTHM'}
                            </button>
                        </div>
                    </section>
                </div>

                {/* RIGHT: AESTHETICS */}
                <div className="col-right">
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ background: 'var(--yellow)', color: 'black' }}>Visual_Frequency</div>
                        <div style={{ padding: '8px' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: '900', marginBottom: '16px', opacity: 0.6 }}>SELECT_RENDER_ENGINE</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => changeTheme('y2k')}
                                    className={`sidebar-btn ${theme === 'y2k' ? 'active' : ''}`}
                                    style={{ padding: '20px', justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <Monitor size={20} />
                                        <span style={{ fontWeight: '900' }}>CYBER_Y2K</span>
                                    </div>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--blue)', border: '2px solid black' }} />
                                </button>

                                <button
                                    onClick={() => changeTheme('midnight')}
                                    className={`sidebar-btn ${theme === 'midnight' ? 'active' : ''}`}
                                    style={{ padding: '20px', justifyContent: 'space-between', background: theme === 'midnight' ? 'var(--green)' : 'var(--btn-bg)', color: theme === 'midnight' ? 'black' : 'var(--text-color)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <Moon size={20} />
                                        <span style={{ fontWeight: '900' }}>MIDNIGHT_VOID</span>
                                    </div>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--purple)', border: '2px solid var(--white)' }} />
                                </button>

                                <div style={{ marginTop: '24px', padding: '16px', border: '2px dashed var(--label-color)', opacity: 0.5 }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: '900', margin: 0, textAlign: 'center' }}>SYSTEM_INFO: ALL_VISUAL_MODES_STABILIZED</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="cyber-card" style={{ marginTop: '32px', background: 'var(--black)', color: 'var(--white)' }}>
                        <div className="cyber-header" style={{ background: 'var(--white)', color: 'var(--black)' }}>Sys_Status</div>
                        <div style={{ padding: '8px', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.5 }}>KERNEL_VERSION:</span>
                                <span>v5.4.1-STRICT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.5 }}>ACTIVE_LEVEL:</span>
                                <span>LVL_{userStats.level}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.5 }}>ENCRYPTION:</span>
                                <span style={{ color: 'var(--green)' }}>BCRYPT_R10</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
