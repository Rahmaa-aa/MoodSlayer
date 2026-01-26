import { Activity, Zap, User, Settings } from 'lucide-react'
import Link from 'next/link'

export function Sidebar({ userStats, activePage }) {
    return (
        <aside className="sidebar-panel">
            {/* Header */}
            <div className="sidebar-header">
                <h1 style={{ fontSize: '1.8rem', fontStyle: 'italic', fontWeight: '900', lineHeight: 0.9, margin: 0, color: 'white' }}>
                    MOOD<br />SLAYER
                </h1>
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

            {/* Footer */}
            <div className="sidebar-footer">
                <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: 0, opacity: 0.8 }}>System v5.2</p>
                <p style={{ fontSize: '0.55rem', color: 'white', opacity: 0.5, margin: 0 }}>OPTIMIZED_UI_ONLINE</p>
            </div>
        </aside>
    )
}
