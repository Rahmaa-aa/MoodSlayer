'use client'
export default function SettingsLoading() {
    return (
        <div className="app-shell">
            <aside className="sidebar-panel" style={{ opacity: 0.5 }}>
                <div className="sidebar-header">
                    <div style={{ height: '40px', background: '#333', marginBottom: '16px' }}></div>
                </div>
            </aside>
            <main className="main-content" style={{ opacity: 0.5 }}>
                <header className="dashboard-header">
                    <div style={{ width: '200px', height: '40px', background: '#ddd' }}></div>
                </header>
                <div className="cyber-card" style={{ height: '400px', background: '#eee', marginTop: '32px' }}></div>
            </main>
        </div>
    )
}
