'use client'
import { useState, useEffect } from 'react'
import { Trophy, Flame, Star, Lock, Zap, Sparkles, TrendingUp } from 'lucide-react'

import { useUser } from '../../context/UserContext'

export default function ProfilePage() {
    const { userStats } = useUser()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const nextLevelXP = userStats.level * 100
    const progress = (userStats.xp % 100)

    const UNLOCKS = [
        { level: 1, label: 'Neural Core', desc: 'Basic mood tracking enabled', unlocked: true },
        { level: 2, label: 'Habit Stepper', desc: 'Numeric tracking unlocked', unlocked: userStats.bestLevel >= 2 || userStats.level >= 2 },
        { level: 3, label: 'Pattern Matrix', desc: 'Visual analytics unlocked', unlocked: userStats.bestLevel >= 3 || userStats.level >= 3 },
        { level: 4, label: 'The Oracle', desc: 'ML correlation analysis', unlocked: userStats.bestLevel >= 4 || userStats.level >= 4 },
        { level: 5, label: 'Aura Projection', desc: 'Predictive visuals unlocked', unlocked: userStats.bestLevel >= 5 || userStats.level >= 5 },
        { level: 10, label: 'Main Character', desc: 'Secret themes unlocked', unlocked: userStats.bestLevel >= 10 || userStats.level >= 10 },
    ]

    return (
        <div className="page-container">
            <header className="dashboard-header">
                <div className="header-title-group">
                    <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>RESIDENT PROFILE</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>USER_01_STATS</h2>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>

                {/* LEFT COLUMN: CORE STATS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* XP & LEVEL CARD */}
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ background: 'var(--blue)', color: 'white' }}>Rank_Status</div>
                        <div style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%', background: 'var(--card-bg)', border: '5px solid black',
                                margin: '0 auto 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '10px 10px 0px var(--blue)'
                            }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--blue)', opacity: 0.8 }}>LEVEL</span>
                                <span style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1, color: 'var(--text-color)' }}>{userStats.level}</span>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '900' }}>
                                    <span>XP PROGRESS</span>
                                    <span>{userStats.xp} / {nextLevelXP}</span>
                                </div>
                                <div style={{ width: '100%', height: '24px', background: 'var(--input-bg)', border: '3px solid black', position: 'relative' }}>
                                    <div style={{
                                        width: `${progress}%`, height: '100%', background: 'var(--blue)',
                                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px'
                                    }}>
                                        {progress > 10 && <Zap size={14} fill="white" color="white" />}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.6 }}>{nextLevelXP - (userStats.xp % 100)} XP UNTIL NEXT RANK</p>
                        </div>
                    </section>

                    {/* STREAK CARD */}
                    <section className="cyber-card" style={{ background: 'black', color: 'white' }}>
                        <div className="cyber-header" style={{ background: 'white', color: 'black' }}>Persistence_Log</div>
                        <div style={{ padding: '40px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ position: 'relative' }}>
                                <Flame size={80} fill="var(--pink)" color="var(--pink)" style={{ filter: 'drop-shadow(0 0 20px var(--pink))' }} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '900', fontSize: '1.5rem', color: 'white', textShadow: '2px 2px 0px black' }}>
                                    {userStats.streak}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', fontStyle: 'italic', margin: 0 }}>{userStats.streak} DAY</h3>
                                <p style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--pink)', textTransform: 'uppercase', margin: 0 }}>CURRENT STREAK</p>
                                <div style={{ marginTop: '16px', fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>
                                    &gt; System uptime: {userStats.streak * 24} hours<br />
                                    &gt; Neural consistency: OPTIMAL
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* RIGHT COLUMN: UNLOCKS */}
                <section className="cyber-card">
                    <div className="cyber-header" style={{ background: 'var(--green)', color: 'black' }}>Neural_Unlocks</div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {UNLOCKS.map((u, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                                background: u.unlocked ? 'var(--card-bg)' : 'var(--input-bg)',
                                border: '3px solid black',
                                boxShadow: u.unlocked ? '4px 4px 0px black' : 'none',
                                opacity: u.unlocked ? 1 : 0.6,
                                transform: u.unlocked ? 'none' : 'scale(0.98)'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', background: u.unlocked ? 'var(--green)' : '#999',
                                    border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {u.unlocked ? <Sparkles size={20} /> : <Lock size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '900', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase' }}>{u.label}</p>
                                    <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.7 }}>{u.desc}</p>
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '900' }}>LV {u.level}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
