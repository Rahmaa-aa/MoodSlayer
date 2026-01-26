import { Activity, Zap, User, Settings } from 'lucide-react'

import Link from 'next/link'

export function Sidebar({ userStats = { level: 1, xp: 0 }, activePage = 'Dashboard' }) {
    const nextLevelXP = userStats.level * 100
    const progress = userStats.xp % 100

    return (
        <aside className="sidebar-panel">
            {/* Header */}
            <div className="sidebar-header">
                <h1 className="text-xxl" style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', lineHeight: 0.9 }}>
                    MOOD<br />SLAYER
                </h1>
            </div>

            {/* Menu */}
            <nav className="sidebar-nav">
                <Link href="/" className={`sidebar-btn ${activePage === 'Dashboard' ? 'active' : ''}`}>
                    <Activity size={18} /> DASHBOARD
                </Link>
                <Link href="/cycles" className={`sidebar-btn ${activePage === 'Cycles' ? 'active' : ''}`}>
                    <Zap size={18} /> CYCLES
                </Link>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'white', border: '3px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.9rem' }}>
                        L{userStats.level}
                    </div>
                    <div>
                        <p style={{ fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>LEVEL {userStats.level}</p>
                        <p style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, opacity: 0.6 }}>XP: {userStats.xp}</p>
                    </div>
                </div>

                {/* XP Bar */}
                <div style={{ width: '100%', height: '8px', background: 'white', border: '2px solid black', position: 'relative' }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: 'var(--green)',
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>
            </div>
        </aside>
    )
}
