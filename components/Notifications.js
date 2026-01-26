import { useState, useEffect } from 'react'

export function Notifications() {
    const [toasts, setToasts] = useState([])

    useEffect(() => {
        const handleNewToast = (e) => {
            const id = Date.now()
            setToasts(prev => [...prev, { id, ...e.detail }])
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 3000)
        }

        window.addEventListener('mood-toast', handleNewToast)
        return () => window.removeEventListener('mood-toast', handleNewToast)
    }, [])

    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    background: 'black', color: t.type === 'xp' ? 'var(--pink)' : 'white',
                    border: `3px solid ${t.type === 'xp' ? 'var(--pink)' : 'var(--green)'}`,
                    padding: '12px 16px',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                    fontWeight: '900', textTransform: 'uppercase',
                    animation: 'slideIn 0.2s ease-out'
                }}>
                    {t.message}
                </div>
            ))}
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export const showToast = (message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('mood-toast', { detail: { message, type } }))
}
