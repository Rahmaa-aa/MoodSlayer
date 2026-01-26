import { Activity, Zap, User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Sidebar({ userStats, activePage }) {
    const { data: session } = useSession()

    return (
        <aside className="sidebar-panel">
            {/* Header */}
            <div className="sidebar-header">
                <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', lineHeight: 0.9, margin: 0, color: 'white' }}>
                    MOOD<br />SLAYER
                </h1>
                {session?.user?.name && (
                    <div style={{ marginTop: '8px', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', color: 'white', fontWeight: '900', fontSize: '0.65rem', border: '1px solid white' }}>
                        USER_ID: {session.user.name.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Menu */}
            <nav className="sidebar-nav">
                <Link href="/" className={`sidebar-btn ${activePage === 'Dashboard' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Activity size={18} /> DASHBOARD
                </Link>
                <Link href="/cycles" className={`sidebar-btn ${activePage === 'Cycles' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Zap size={18} /> CYCLES
                </Link>
                <Link href="/profile" className={`sidebar-btn ${activePage === 'Profile' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <User size={18} /> PROFILE
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
