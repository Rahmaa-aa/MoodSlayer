import { Activity, Zap, User, Settings, LogOut, Flame, Sword, LifeBuoy, HeartPulse } from 'lucide-react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useUser } from '@/context/UserContext'

export function Sidebar({ activePage }) {
    const { data: session } = useSession()
    const { userStats, toggleSurvivalMode } = useUser()

    return (
        <aside className="sidebar-panel">
            {/* Header */}
            <div className="sidebar-header">
                <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', lineHeight: 0.9, margin: 0, color: 'white' }}>
                    MOOD<br />SLAYER
                </h1>
                {session?.user?.name && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                        <div style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.2)', color: 'white', fontWeight: '900', fontSize: '0.65rem', border: '1px solid white' }}>
                            USER_ID: {session.user.name.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ flex: 1, padding: '4px 8px', background: 'var(--blue)', color: 'white', fontWeight: '900', fontSize: '0.65rem', border: '1px solid black', textAlign: 'center' }}>
                                LVL_{userStats.level}
                            </div>
                            <div style={{ flex: 1, padding: '4px 8px', background: 'var(--pink)', color: 'white', fontWeight: '900', fontSize: '0.65rem', border: '1px solid black', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} title="Current Streak">
                                <Flame size={10} fill="white" /> {userStats.streak}D
                            </div>
                            {userStats.bestStreak > userStats.streak && (
                                <div style={{ flex: 1, padding: '4px 8px', background: 'black', color: 'var(--yellow)', fontWeight: '900', fontSize: '0.65rem', border: '1px solid black', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} title="Best Streak">
                                    BEST_{userStats.bestStreak}D
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <nav className="sidebar-nav">
                {/* Compassionate Toggle */}
                <div style={{ marginBottom: '8px' }}>
                    <button
                        onClick={toggleSurvivalMode}
                        className="sidebar-btn"
                        style={{
                            width: '100%',
                            background: userStats.survivalMode ? 'var(--yellow)' : 'white',
                            color: 'black',
                            border: userStats.survivalMode ? '3px solid black' : '1px dashed rgba(0,0,0,0.2)',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: userStats.survivalMode ? '4px 4px 0px black' : 'none',
                            opacity: userStats.survivalMode ? 1 : 0.7
                        }}
                    >
                        {userStats.survivalMode ? <LifeBuoy size={18} /> : <HeartPulse size={18} opacity={0.5} />}
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.8, color: 'black' }}>{userStats.survivalMode ? 'MODE: ACTIVE' : 'SYSTEM_STABLE'}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'black' }}>{userStats.survivalMode ? 'STRUGGLING_MODE' : "I'M STRUGGLING"}</div>
                        </div>
                    </button>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', marginTop: '16px' }}></div>
                </div>

                <Link href="/" className={`sidebar-btn ${activePage === 'Dashboard' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Activity size={18} /> DASHBOARD
                </Link>
                <Link href="/cycles" className={`sidebar-btn ${activePage === 'Cycles' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Zap size={18} /> CYCLES
                </Link>
                <Link href="/profile" className={`sidebar-btn ${activePage === 'Profile' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} /> PROFILE
                </Link>
                <Link href="/elysium" className={`sidebar-btn ${activePage === 'Elysium' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Sword size={18} /> ELYSIUM
                </Link>
                <Link href="/settings" className={`sidebar-btn ${activePage === 'Settings' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Settings size={18} /> SETTINGS
                </Link>
            </nav>

            {/* Auth Footer */}
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="sidebar-btn"
                    style={{ background: 'black', color: 'white', border: '3px solid white', fontSize: '0.65rem' }}
                >
                    <LogOut size={14} /> LOG OUT
                </button>
                <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: 0, opacity: 0.8 }}>System v5.4</p>
                    <p style={{ fontSize: '0.55rem', color: 'white', opacity: 0.5, margin: 0 }}>SECURE_SESSION_ACTIVE</p>
                </div>
            </div>
        </aside>
    )
}
