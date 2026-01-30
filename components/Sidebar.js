'use client'
import { Activity, Zap, User, Settings, LogOut, Flame, Sword, LifeBuoy, HeartPulse, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useUser } from '@/context/UserContext'
import { usePathname } from 'next/navigation'

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const { userStats, toggleSurvivalMode, isMiniSidebar: isMini, toggleSidebar: toggleMini } = useUser()

    const activePage = {
        '/': 'Dashboard',
        '/cycles': 'Cycles',
        '/profile': 'Profile',
        '/elysium': 'Elysium',
        '/settings': 'Settings'
    }[pathname] || 'Dashboard'

    if (pathname.startsWith('/auth')) return null;

    return (
        <aside className="sidebar-panel" style={{ width: isMini ? '80px' : '240px', transition: 'width 0.3s ease' }}>
            {/* Floating Toggle Handle */}
            <button
                onClick={toggleMini}
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-16px',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '3px solid black',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    boxShadow: '4px 4px 0px black',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    e.currentTarget.style.background = 'var(--blue)';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = 'black';
                }}
                title={isMini ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isMini ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
            </button>

            {/* Header */}
            <div className="sidebar-header" style={{
                padding: isMini ? '12px 8px' : '20px 16px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: isMini ? '70px' : '100px'
            }}>
                <img
                    src="/logo.png"
                    alt="MoodSlayer"
                    style={{
                        width: isMini ? '45px' : '190px',
                        height: 'auto',
                        objectFit: 'contain',
                        margin: '0 auto'
                    }}
                />

                {session?.user?.name && !isMini && (
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
            <nav className="sidebar-nav" style={{ padding: isMini ? '16px 8px' : '16px' }}>
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
                            padding: isMini ? '12px 0' : '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isMini ? 'center' : 'flex-start',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: userStats.survivalMode ? '4px 4px 0px black' : 'none',
                            opacity: userStats.survivalMode ? 1 : 0.7
                        }}
                        title={isMini ? (userStats.survivalMode ? 'SURVIVAL ON' : 'STABILIZING') : ''}
                    >
                        {userStats.survivalMode ? <LifeBuoy size={18} /> : <HeartPulse size={18} opacity={0.5} />}
                        {!isMini && (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.8, color: 'black' }}>{userStats.survivalMode ? 'MODE: ACTIVE' : 'SYSTEM_STABLE'}</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'black' }}>{userStats.survivalMode ? 'STRUGGLING_MODE' : "I'M STRUGGLING"}</div>
                            </div>
                        )}
                    </button>
                    {!isMini && <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', marginTop: '16px' }}></div>}
                </div>

                <Link href="/" className={`sidebar-btn ${activePage === 'Dashboard' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}>
                    <Activity size={18} /> {!isMini && 'DASHBOARD'}
                </Link>
                <Link href="/cycles" className={`sidebar-btn ${activePage === 'Cycles' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}>
                    <Zap size={18} /> {!isMini && 'CYCLES'}
                </Link>
                <Link href="/profile" className={`sidebar-btn ${activePage === 'Profile' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}>
                    <User size={18} /> {!isMini && 'PROFILE'}
                </Link>
                <Link href="/elysium" className={`sidebar-btn ${activePage === 'Elysium' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}>
                    <Sword size={18} /> {!isMini && 'ELYSIUM'}
                </Link>
                <Link href="/settings" className={`sidebar-btn ${activePage === 'Settings' ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}>
                    <Settings size={18} /> {!isMini && 'SETTINGS'}
                </Link>
            </nav>

            {/* Auth Footer */}
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="sidebar-btn"
                    style={{ background: 'black', color: 'white', border: '3px solid white', fontSize: '0.65rem', justifyContent: isMini ? 'center' : 'flex-start', padding: isMini ? '12px 0' : '10px 12px' }}
                >
                    <LogOut size={14} /> {!isMini && 'LOG OUT'}
                </button>
                {!isMini && (
                    <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: 0, opacity: 0.8 }}>System v5.4</p>
                        <p style={{ fontSize: '0.55rem', color: 'white', opacity: 0.5, margin: 0 }}>SECURE_SESSION_ACTIVE</p>
                    </div>
                )}
            </div>
        </aside>
    )
}
