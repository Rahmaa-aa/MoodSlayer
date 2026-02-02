'use client'
import React from 'react'
import { X, TriangleAlert } from 'lucide-react'

export function ConfirmationModal({
    title = "CONFIRM_ACTION",
    message = "ARE_YOU_SURE_YOU_WANT_TO_PROCEED?",
    confirmText = "CONFIRM",
    cancelText = "CANCEL",
    onConfirm,
    onCancel,
    severity = 'warning'
}) {
    const colors = {
        warning: 'var(--yellow)',
        danger: 'var(--pink)',
        info: 'var(--blue)'
    }

    const themeColor = colors[severity] || colors.warning

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, animation: 'fadeIn 0.15s ease-out'
        }}>
            <div style={{
                width: '420px', background: 'var(--card-bg)', border: '4px solid black',
                boxShadow: '10px 10px 0px black', position: 'relative',
                overflow: 'hidden'
            }}>
                {/* HEADER STRIPE */}
                <div style={{
                    background: 'black', color: 'white', padding: '8px 12px',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <TriangleAlert size={16} color={themeColor} />
                    <span style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '0.6rem', letterSpacing: '1px'
                    }}>
                        {title}
                    </span>
                </div>

                <div style={{ padding: '32px' }}>
                    <p style={{
                        fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-color)',
                        lineHeight: 1.5, margin: '0 0 32px 0', textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {message}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button
                            onClick={onCancel}
                            className="sidebar-btn"
                            style={{
                                background: 'var(--btn-bg)', color: 'var(--text-color)', border: '3px solid black',
                                padding: '14px', fontWeight: '900', fontSize: '0.7rem',
                                boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', cursor: 'pointer'
                            }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="sidebar-btn"
                            style={{
                                background: themeColor, color: 'black', border: '3px solid black',
                                padding: '14px', fontWeight: '900', fontSize: '0.7rem',
                                boxShadow: '4px 4px 0px black', cursor: 'pointer'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* CLOSE BUTTON */}
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute', top: '6px', right: '10px',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'white'
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
