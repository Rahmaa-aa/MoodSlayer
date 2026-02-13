'use client'
import { useState } from 'react'
import { Moon, Sun, Flower2, Droplets, Sparkles, Save, Calendar, XCircle, Power, AlertTriangle } from 'lucide-react'

/**
 * Calculates current cycle day and phase from user profile data.
 */
function getCycleInfo(lastPeriodStart, cycleLength = 28) {
    if (!lastPeriodStart) return null

    const start = new Date(lastPeriodStart)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Don't wrap with modulo — detect late periods
    const rawCycleDay = totalDays + 1
    const isLate = rawCycleDay > cycleLength
    const daysLate = isLate ? rawCycleDay - cycleLength : 0
    const cycleDay = isLate ? rawCycleDay : rawCycleDay

    const scale = cycleLength / 28
    const menstrualEnd = Math.round(5 * scale)
    const follicularEnd = Math.round(13 * scale)
    const ovulationEnd = Math.round(16 * scale)

    let phase, phaseLabel, phaseColor, PhaseIcon, phaseDesc, phaseEmoji
    if (isLate) {
        phase = 'late'; phaseLabel = 'LATE'; phaseColor = 'var(--pink)'
        PhaseIcon = AlertTriangle; phaseDesc = `${daysLate} day${daysLate > 1 ? 's' : ''} past expected cycle`; phaseEmoji = '⚠️'
    } else if (cycleDay <= menstrualEnd) {
        phase = 'menstrual'; phaseLabel = 'MENSTRUAL'; phaseColor = 'var(--pink)'
        PhaseIcon = Droplets; phaseDesc = 'Rest & recovery period'; phaseEmoji = '🩸'
    } else if (cycleDay <= follicularEnd) {
        phase = 'follicular'; phaseLabel = 'FOLLICULAR'; phaseColor = 'var(--green)'
        PhaseIcon = Flower2; phaseDesc = 'Rising energy & creativity'; phaseEmoji = '🌱'
    } else if (cycleDay <= ovulationEnd) {
        phase = 'ovulation'; phaseLabel = 'OVULATION'; phaseColor = 'var(--yellow)'
        PhaseIcon = Sun; phaseDesc = 'Peak energy & social drive'; phaseEmoji = '✨'
    } else {
        phase = 'luteal'; phaseLabel = 'LUTEAL'; phaseColor = 'var(--purple)'
        PhaseIcon = Moon; phaseDesc = 'Winding down & introspection'; phaseEmoji = '🌙'
    }

    const progress = isLate ? 100 : (cycleDay / cycleLength) * 100
    const daysUntilNextPeriod = isLate ? 0 : cycleLength - cycleDay + 1

    return {
        cycleDay, cycleLength, phase, phaseLabel, phaseColor,
        PhaseIcon, phaseDesc, phaseEmoji,
        daysUntilNextPeriod, progress, isLate, daysLate
    }
}

const PHASE_COLORS_RAW = {
    menstrual: '#ff1493', follicular: '#7fff00',
    ovulation: '#ffff00', luteal: '#8a2be2',
    late: '#ff1493'
}

export function CycleTracker({ tracksCycle, lastPeriodStart, cycleLength, isEditMode, onUpdate }) {
    const [editLengthStr, setEditLengthStr] = useState(String(cycleLength || 28))
    const [editDate, setEditDate] = useState(
        lastPeriodStart ? new Date(lastPeriodStart).toISOString().split('T')[0] : ''
    )
    const [saving, setSaving] = useState(false)

    // Clamp only on blur so user can freely type
    const handleLengthBlur = () => {
        const n = parseInt(editLengthStr) || 28
        const clamped = Math.max(18, Math.min(90, n))
        setEditLengthStr(String(clamped))
    }

    if (!tracksCycle) return null

    const info = lastPeriodStart ? getCycleInfo(lastPeriodStart, cycleLength) : null
    const today = new Date().toISOString().split('T')[0]
    const isLoggedToday = lastPeriodStart && new Date(lastPeriodStart).toISOString().split('T')[0] === today

    // Persist helper
    const updateCycle = async (data) => {
        setSaving(true)
        try {
            await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (onUpdate) await onUpdate()
        } catch (e) {
            console.error('Cycle update failed:', e)
        } finally {
            setSaving(false)
        }
    }

    const handleLogPeriod = () => updateCycle({
        tracksCycle: true,
        lastPeriodStart: today,
        cycleLength: cycleLength
    })

    const handleUnlogPeriod = () => updateCycle({
        tracksCycle: true,
        lastPeriodStart: null,
        cycleLength: cycleLength
    })

    const handleDisableTracking = () => updateCycle({
        tracksCycle: false,
        lastPeriodStart: null,
        cycleLength: cycleLength
    })

    const handleSaveEdit = async () => {
        const finalLength = Math.max(18, Math.min(90, parseInt(editLengthStr) || 28))
        setEditLengthStr(String(finalLength))
        await updateCycle({
            tracksCycle: true,
            lastPeriodStart: editDate || null,
            cycleLength: finalLength
        })
    }

    // SVG ring
    const size = 110
    const strokeWidth = 10
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDash = info ? (info.progress / 100) * circumference : 0

    const phases = [
        { name: 'menstrual', start: 0, end: 5 / 28 },
        { name: 'follicular', start: 5 / 28, end: 13 / 28 },
        { name: 'ovulation', start: 13 / 28, end: 16 / 28 },
        { name: 'luteal', start: 16 / 28, end: 1 },
    ]

    const headerBg = info ? PHASE_COLORS_RAW[info.phase] : 'var(--pink)'
    const headerColor = info?.phase === 'ovulation' || info?.phase === 'follicular' ? 'black' : 'white'

    return (
        <section className="cyber-card" style={{ marginBottom: 0 }}>
            <div className="cyber-header" style={{ background: headerBg, color: headerColor }}>
                Body_Rhythm {info?.phaseEmoji || '🌙'}
            </div>

            <div style={{ padding: '20px 16px' }}>

                {/* === EDIT MODE (controlled by dashboard Edit Mode button) === */}
                {isEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Last period date */}
                        <div>
                            <label className="control-label">LAST_PERIOD_START</label>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                border: 'var(--card-border)', background: 'var(--input-bg)'
                            }}>
                                <div style={{
                                    padding: '10px', borderRight: 'var(--card-border)',
                                    display: 'flex', alignItems: 'center', background: 'var(--btn-bg)'
                                }}>
                                    <Droplets size={14} color="var(--pink)" />
                                </div>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    max={today}
                                    style={{
                                        flex: 1, border: 'none', padding: '10px', outline: 'none',
                                        fontWeight: '700', fontSize: '0.85rem', fontFamily: 'inherit',
                                        background: 'transparent', color: 'var(--text-color)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Cycle length */}
                        <div>
                            <label className="control-label">CYCLE_LENGTH (DAYS)</label>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                border: 'var(--card-border)', background: 'var(--input-bg)'
                            }}>
                                <div style={{
                                    padding: '10px', borderRight: 'var(--card-border)',
                                    display: 'flex', alignItems: 'center', background: 'var(--btn-bg)'
                                }}>
                                    <Calendar size={14} color="var(--purple)" />
                                </div>
                                <input
                                    type="number"
                                    min={18} max={90}
                                    value={editLengthStr}
                                    onChange={(e) => setEditLengthStr(e.target.value)}
                                    onBlur={handleLengthBlur}
                                    style={{
                                        flex: 1, border: 'none', padding: '10px', outline: 'none',
                                        fontWeight: '800', fontSize: '1rem', fontFamily: 'inherit',
                                        background: 'transparent', color: 'var(--text-color)', width: '100%'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '0.55rem', fontWeight: '700', opacity: 0.4, margin: '4px 0 0 0' }}>
                                18–90 days. Irregular? Just log each period when it starts.
                            </p>
                        </div>

                        {/* Save */}
                        <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="sidebar-btn"
                            style={{
                                width: '100%', background: 'var(--text-color)', color: 'var(--bg-color)',
                                justifyContent: 'center', border: 'var(--card-border)',
                                opacity: saving ? 0.5 : 1
                            }}
                        >
                            <Save size={14} /> {saving ? 'SYNCING...' : 'SAVE_CHANGES'}
                        </button>

                        {/* Disable tracking */}
                        <button
                            onClick={handleDisableTracking}
                            disabled={saving}
                            className="sidebar-btn"
                            style={{
                                width: '100%', background: 'transparent',
                                color: 'var(--pink)', justifyContent: 'center',
                                border: '2px dashed var(--pink)',
                                fontSize: '0.65rem', opacity: saving ? 0.5 : 0.7
                            }}
                        >
                            <Power size={12} /> DISABLE_CYCLE_TRACKING
                        </button>
                    </div>
                ) : info ? (
                    /* === VIEW MODE (has data) === */
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* SVG Ring */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                                    {phases.map((p, i) => {
                                        const segStart = p.start * circumference
                                        const segLength = (p.end - p.start) * circumference
                                        return (
                                            <circle key={i} cx={size / 2} cy={size / 2} r={radius}
                                                fill="none" stroke={PHASE_COLORS_RAW[p.name]}
                                                strokeWidth={strokeWidth}
                                                strokeDasharray={`${segLength} ${circumference - segLength}`}
                                                strokeDashoffset={-segStart} opacity={0.15}
                                            />
                                        )
                                    })}
                                    <circle cx={size / 2} cy={size / 2} r={radius}
                                        fill="none" stroke={PHASE_COLORS_RAW[info.phase]}
                                        strokeWidth={strokeWidth + 2}
                                        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%, -50%)', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1, color: 'var(--text-color)' }}>
                                        {info.cycleDay}
                                    </div>
                                    <div style={{ fontSize: '0.5rem', fontWeight: '800', opacity: 0.4, letterSpacing: '1px', color: 'var(--text-color)' }}>
                                        DAY
                                    </div>
                                </div>
                            </div>

                            {/* Phase info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <div style={{
                                        width: '26px', height: '26px',
                                        background: PHASE_COLORS_RAW[info.phase],
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid var(--panel-edge)'
                                    }}>
                                        <info.PhaseIcon size={13}
                                            color={info.phase === 'ovulation' || info.phase === 'follicular' ? 'black' : 'white'}
                                        />
                                    </div>
                                    <span style={{ fontWeight: '900', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-color)' }}>
                                        {info.phaseLabel}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--label-color)', margin: '0 0 10px 0' }}>
                                    {info.phaseDesc}
                                </p>
                                <div style={{
                                    padding: '6px 10px',
                                    background: info.isLate ? 'rgba(255,20,147,0.1)' : 'var(--bg-color)',
                                    border: info.isLate ? '2px solid var(--pink)' : '2px solid var(--panel-edge)',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-color)'
                                }}>
                                    {info.isLate ? (
                                        <>
                                            <AlertTriangle size={11} color="var(--pink)" />
                                            <span style={{ color: 'var(--pink)' }}>
                                                {info.daysLate} DAY{info.daysLate > 1 ? 'S' : ''} LATE
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={11} color={PHASE_COLORS_RAW[info.phase]} />
                                            <span style={{ opacity: 0.5 }}>NEXT_CYCLE:</span>
                                            <span style={{ color: PHASE_COLORS_RAW[info.phase] }}>
                                                {info.daysUntilNextPeriod} DAYS
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Phase legend */}
                        <div style={{ display: 'flex', gap: '3px', marginTop: '14px' }}>
                            {phases.map(p => (
                                <div key={p.name} style={{
                                    flex: p.end - p.start, height: '5px',
                                    background: PHASE_COLORS_RAW[p.name],
                                    opacity: p.name === info.phase ? 1 : 0.2,
                                    border: '1px solid var(--panel-edge)',
                                    transition: 'opacity 0.3s ease'
                                }} />
                            ))}
                        </div>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '0.45rem', fontWeight: '800',
                            color: 'var(--label-color)', marginTop: '3px', letterSpacing: '0.3px'
                        }}>
                            <span>MENSTRUAL</span><span>FOLLICULAR</span>
                            <span>OVULATION</span><span>LUTEAL</span>
                        </div>

                        {/* LOG / UNLOG period */}
                        {isLoggedToday ? (
                            <button
                                onClick={handleUnlogPeriod}
                                disabled={saving}
                                className="sidebar-btn"
                                style={{
                                    width: '100%', marginTop: '14px',
                                    background: 'var(--card-bg)',
                                    color: 'var(--pink)',
                                    border: '2px dashed var(--pink)',
                                    justifyContent: 'center', fontWeight: '900',
                                    fontSize: '0.7rem', letterSpacing: '1px', padding: '10px',
                                    opacity: saving ? 0.5 : 1
                                }}
                            >
                                <XCircle size={14} /> {saving ? 'UNDOING...' : 'UNLOG_PERIOD'}
                            </button>
                        ) : (
                            <button
                                onClick={handleLogPeriod}
                                disabled={saving}
                                className="sidebar-btn"
                                style={{
                                    width: '100%', marginTop: '14px',
                                    background: 'var(--pink)', color: 'white',
                                    border: 'var(--card-border)',
                                    justifyContent: 'center', fontWeight: '900',
                                    fontSize: '0.7rem', letterSpacing: '1px', padding: '10px',
                                    opacity: saving ? 0.5 : 1
                                }}
                            >
                                <Droplets size={14} /> {saving ? 'LOGGING...' : 'LOG_PERIOD_START'}
                            </button>
                        )}
                        <p style={{
                            fontSize: '0.55rem', fontWeight: '700',
                            color: 'var(--label-color)', textAlign: 'center', margin: '6px 0 0 0'
                        }}>
                            {isLoggedToday
                                ? 'Logged today — tap to undo if it was a mistake'
                                : 'Tap when your period starts to keep predictions accurate'}
                        </p>
                    </>
                ) : (
                    /* === NO DATA YET === */
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Moon size={32} style={{ opacity: 0.2, marginBottom: '12px' }} color="var(--text-color)" />
                        <p style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--text-color)', margin: '0 0 4px 0' }}>
                            NO_DATA_YET
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--label-color)', margin: '0 0 12px 0' }}>
                            Log your first period to start tracking
                        </p>
                        <button
                            onClick={handleLogPeriod}
                            disabled={saving}
                            className="sidebar-btn"
                            style={{
                                width: '100%', background: 'var(--pink)', color: 'white',
                                border: 'var(--card-border)', justifyContent: 'center',
                                opacity: saving ? 0.5 : 1
                            }}
                        >
                            <Droplets size={14} /> {saving ? 'LOGGING...' : 'LOG_PERIOD_START'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
