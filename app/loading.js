'use client'
export default function Loading() {
    return (
        <div className="app-shell">
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.8)', zIndex: 9999
            }}>
                <div className="animate-pulse" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', marginBottom: '8px' }}>NEURAL_UPLINK...</div>
                    <div style={{ height: '4px', width: '200px', background: 'black', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
                            background: 'var(--pink)', animation: 'shimmer 1.5s infinite linear'
                        }}></div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes shimmer {
                    from { left: -100%; }
                    to { left: 200%; }
                }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    )
}
