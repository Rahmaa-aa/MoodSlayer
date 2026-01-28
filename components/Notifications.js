import { useState, useEffect } from 'react'

export function Notifications() {
    const [toasts, setToasts] = useState([])

    useEffect(() => {
        const handleNewToast = (e) => {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            setToasts(prev => [...prev, { id, ...e.detail }])
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 3000)
        }

        window.addEventListener('mood-toast', handleNewToast)
        return () => window.removeEventListener('mood-toast', handleNewToast)
    }, [])

    const getToastStyles = (type) => {
        const base = {
            background: 'black',
            color: 'white',
            padding: '12px 16px',
            boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
            fontWeight: '900',
            textTransform: 'uppercase',
            animation: 'slideIn 0.2s ease-out',
            fontSize: '0.9rem',
            letterSpacing: '1px'
        }

        switch (type) {
            case 'success':
                return { ...base, border: '3px solid var(--green)', color: 'var(--green)' }
            case 'error':
            case 'xp':
                return { ...base, border: '3px solid var(--pink)', color: 'var(--pink)' }
            case 'warning':
                return { ...base, border: '3px solid var(--yellow)', color: 'var(--yellow)' }
            default:
                return { ...base, border: '3px solid white' }
        }
    }

    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
            {toasts.map(t => (
                <div key={t.id} style={getToastStyles(t.type)}>
                    <span style={{ marginRight: '8px' }}>&gt;</span>
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
