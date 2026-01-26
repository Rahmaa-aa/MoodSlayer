import { Activity, Zap, User, Settings } from 'lucide-react'
import Link from 'next/link'

export function Sidebar({ userStats, activePage }) {
    return (
        <aside className="sidebar-panel" style={{ overflowX: 'hidden' }}>
            {/* Header */}
            <div className="sidebar-header" style={{ padding: '24px 16px' }}>
                <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', lineHeight: 0.9, margin: 0 }}>
                    MOOD<br />SLAYER
                </h1>
            </div>

            {/* Menu */}
            <nav className="sidebar-nav" style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/" className={`sidebar-btn ${activePage === 'Dashboard' ? 'active' : ''}`}>
                    <Activity size={18} /> DASHBOARD
                </Link>
                <Link href="/cycles" className={`sidebar-btn ${activePage === 'Cycles' ? 'active' : ''}`}>
                    <Zap size={18} /> CYCLES
                </Link>
                <Link href="/profile" className={`sidebar-btn ${activePage === 'Profile' ? 'active' : ''}`}>
                    <User size={18} /> PROFILE
                </Link>
                <Link href="/settings" className={`sidebar-btn ${activePage === 'Settings' ? 'active' : ''}`}>
                    <Settings size={18} /> SETTINGS
                </Link>
            </nav>

            <div style={{ flex: 1 }}></div>

            {/* Simple Footer Version */}
            <div className="sidebar-footer" style={{ padding: '24px 16px', borderTop: '2px solid black' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase' }}>System v5.1</p>
            </div>
        </aside>
    )
}
