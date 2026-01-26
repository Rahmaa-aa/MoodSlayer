'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Settings, Shield, Palette, Zap } from 'lucide-react'

import { useUser } from '../context/UserContext'

export default function SettingsPage() {
    const { userStats } = useUser()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="app-shell">
            <Sidebar activePage="Settings" />
            <main className="main-content">
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>CONFIGURATION</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>SYSTEM_PREFERENCES</h2>
                    </div>
                </header>

                <div className="cyber-card">
                    <div className="cyber-header" style={{ background: 'black', color: 'white' }}>Settings_Matrix</div>
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f5f5f5', border: '3px solid black' }}>
                            <Palette size={24} />
                            <div>
                                <p style={{ fontWeight: '900', margin: 0 }}>THEME_CONTROL</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Cyber Y2K (Default)</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f5f5f5', border: '3px solid black' }}>
                            <Shield size={24} />
                            <div>
                                <p style={{ fontWeight: '900', margin: 0 }}>PRIVACY_SHIELD</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Local MongoDB Storage Active</p>
                            </div>
                        </div>
                        <div style={{ opacity: 0.4 }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: '900' }}>MORE_CONTROLS_UNLOCKED_AT_LEVEL_10</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
