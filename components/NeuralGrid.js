'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// NEURALGRID V3.7 // STABLE_RESTORE
export default function NeuralGrid({ history = [], trackables = [] }) {
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return <div style={{ height: '400px', background: 'rgba(0,0,0,0.02)', border: '2px dashed #000' }}></div>

    const moodColors = {
        'Happy': '#7fff00',
        'Energetic': '#ffff00',
        'Chill': '#8a2be2',
        'Sad': '#1493ff'
    }

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const formatDateStr = (d) => {
        try {
            const date = new Date(year, month, d)
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        } catch (e) { return '' }
    }

    const getEntryForDay = (day) => {
        const dateStr = formatDateStr(day)
        if (!dateStr || !Array.isArray(history)) return null
        return history.find(e => {
            try {
                const date = new Date(e.date)
                const entryDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                return entryDateStr === dateStr
            } catch (err) { return false }
        })
    }

    const DAYS_HEADER = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const calendarDays = []

    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} style={{ aspectRatio: '1' }}></div>)
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const entry = getEntryForDay(d)
        const mood = entry?.data?.mood
        const habitsCount = Object.keys(entry?.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note') && entry?.data?.[k]).length
        const isSelected = selectedDay === d

        let color = '#fff'
        if (mood) {
            color = moodColors[mood] || '#999'
        } else if (entry) {
            color = '#f0f0f0' // PARTAL_LOG: Entry exists but no mood check
        }

        calendarDays.push(
            <div
                key={d}
                onClick={() => setSelectedDay(isSelected ? null : d)}
                style={{
                    aspectRatio: '1',
                    border: '2px solid black',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: color,
                    boxShadow: isSelected ? `0 0 20px ${color}` : '4px 4px 0px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: isSelected ? 20 : 1,
                    transform: isSelected ? 'scale(1.05)' : 'none',
                    transition: 'all 0.1s'
                }}
            >
                <span style={{ fontSize: '1rem', fontWeight: '900', color: mood ? 'white' : 'black', textShadow: mood ? '1px 1px 2px black' : 'none' }}>{d}</span>
                {habitsCount > 0 && (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {Array.from({ length: Math.min(habitsCount, 4) }).map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', background: 'black', border: '1px solid white' }}></div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const selectedEntry = selectedDay ? getEntryForDay(selectedDay) : null

    return (
        <section style={{ border: '5px solid black', background: 'white', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '15px 15px 0px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
            <div style={{ background: 'black', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px' }}>NEURAL_GRID_V3.7 // STABLE_RESTORE</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'white', border: '2px solid black', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} color="black" /></button>
                    <span style={{ background: '#ffff00', color: 'black', padding: '6px 20px', fontWeight: '900', fontSize: '0.85rem', border: '3px solid black', minWidth: '180px', textAlign: 'center' }}>
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </span>
                    <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'white', border: '2px solid black', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} color="black" /></button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '500px' }}>
                <div style={{ flex: '3 1 700px', padding: '40px', borderRight: '5px solid black', background: 'white', backgroundImage: 'radial-gradient(#eee 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', marginBottom: '20px' }}>
                        {DAYS_HEADER.map(d => <div key={d} style={{ textAlign: 'center', fontWeight: '900', fontSize: '0.8rem', color: '#000', background: '#eee', padding: '5px', border: '2px solid black' }}>{d}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
                        {calendarDays}
                    </div>
                </div>

                <div style={{ flex: '1 1 350px', background: '#0a0a0a', color: '#7fff00', padding: '30px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    <div style={{ borderBottom: '2px solid #222', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#444' }}>&gt; RECALL_SYS_V3.7</span>
                        <span style={{ color: '#ff1493' }}>[ONLINE]</span>
                    </div>
                    {selectedDay ? (
                        <div style={{ height: '100%', overflowY: 'auto' }}>
                            <p style={{ color: '#ff1493', fontWeight: 'bold' }}>&gt; DATA_RECALL --DATE={formatDateStr(selectedDay)}</p>
                            {selectedEntry ? (
                                <div style={{ marginTop: '25px' }}>
                                    <p>MOOD: <span style={{ color: moodColors[selectedEntry.data?.mood] || '#fff' }}>{selectedEntry.data?.mood?.toUpperCase() || 'NULL'}</span></p>
                                    <p style={{ color: '#1493ff', marginTop: '15px', marginBottom: '10px' }}>HABITS:</p>
                                    {Object.keys(selectedEntry.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note') && selectedEntry.data?.[k]).map(hid => (
                                        <div key={hid} style={{ paddingLeft: '15px', color: '#ccc', marginBottom: '6px' }}>• {hid.toUpperCase()}</div>
                                    ))}
                                </div>
                            ) : <p style={{ opacity: 0.5, marginTop: '30px' }}>// NO_DATA_RECORDED</p>}
                        </div>
                    ) : (
                        <div style={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, textAlign: 'center' }}>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '4px' }}>READY_FOR_INPUT</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
