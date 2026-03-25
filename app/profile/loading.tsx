'use client'
export default function ProfileLoading() {
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
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginTop: '32px' }}>
                    <div className="cyber-card" style={{ height: '500px', background: '#eee' }}></div>
                    <div className="cyber-card" style={{ height: '500px', background: '#eee' }}></div>
                </div>
            </main>
        </div>
    )
}
