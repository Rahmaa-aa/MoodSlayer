'use client'
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Smile, CloudRain, Moon, Zap, Calendar, Heart, Activity, Plus, Pencil, Trash2, Settings, Flame, Target, X, LifeBuoy, ShieldAlert, Sparkles } from 'lucide-react'
import { TrackableManager } from '../components/TrackableManager'
import { RetroToggle } from '../components/RetroToggle'
import { Stepper } from '../components/Stepper'
import { Notifications, showToast } from '../components/Notifications'
import { useUser } from '../context/UserContext'
import { ElysiumStats } from '../components/ElysiumStats'
import { GoalManager } from '../components/GoalManager'

// Dynamic imports for performance (No DND needed on SSR)
const DndContext = dynamic(() => import('@dnd-kit/core').then(mod => mod.DndContext), { ssr: false })
const SortableContext = dynamic(() => import('@dnd-kit/sortable').then(mod => mod.SortableContext), { ssr: false })
const SortableHabit = dynamic(() => import('../components/SortableHabit').then(mod => mod.SortableHabit), { ssr: false })
const DragOverlay = dynamic(() => import('@dnd-kit/core').then(mod => mod.DragOverlay), { ssr: false })

// Helper functions for DND
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { useRouter, useSearchParams } from 'next/navigation'

export default function Home() {
    return (
        <React.Suspense fallback={<div className="app-shell" style={{ background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>INITIALIZING_TEMPORAL_CORE...</div>}>
            <HomeContent />
        </React.Suspense>
    )
}

function HomeContent() {
    const { userStats, setUserStats, trackables, setTrackables, refreshStats } = useUser()
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParam = searchParams.get('date')

    const [formData, setFormData] = useState({ mood: '' })
    const [stats, setStats] = useState({ total: 0, stability: 100 })
    const [isSaving, setIsSaving] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showManager, setShowManager] = useState(false)
    const [showGoalManager, setShowGoalManager] = useState(false)

    const [targetDate, setTargetDate] = useState(null)

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [lastSaved, setLastSaved] = useState(null)
    const [initialLoadDone, setInitialLoadDone] = useState(false)

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0]
        setTargetDate(dateParam || todayStr)
    }, [dateParam])

    useEffect(() => {
        setMounted(true)
        if (targetDate) {
            loadInitialData()
        }
    }, [targetDate])

    const loadInitialData = async () => {
        try {
            fetchEntries(targetDate)
        } catch (e) {
            console.error('Failed to load entries', e)
        }
    }

    const fetchEntries = async (dateToFind) => {
        try {
            const res = await fetch('/api/entries')
            const data = await res.json()
            if (Array.isArray(data)) {
                // Find target day's entry to restore state
                const entry = data.find(e => {
                    const d = new Date(e.date)
                    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    return dStr === dateToFind
                })

                if (entry && entry.data) {
                    setFormData(prev => ({ ...prev, ...entry.data }))
                } else {
                    // Reset if no entry found for this date
                    setFormData({ mood: '' })
                }

                const happyCount = data.filter(e => e.data?.mood === 'Happy').length
                const total = data.length
                const stability = total > 0 ? Math.round((happyCount / total) * 100) : 100
                setStats({ total, stability })
            }
            setInitialLoadDone(true)
        } catch (e) {
            console.error('Failed to fetch entries')
            setInitialLoadDone(true)
        }
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const MOOD_OPTIONS = [
        { label: 'Happy', icon: <Smile size={32} />, color: '#000', bg: 'var(--green)' },
        { label: 'Sad', icon: <CloudRain size={32} />, color: '#fff', bg: 'var(--blue)' },
        { label: 'Chill', icon: <Moon size={32} />, color: '#fff', bg: 'var(--purple)' },
        { label: 'Energetic', icon: <Zap size={32} />, color: '#000', bg: 'var(--yellow)' },
    ]

    // Initialize formData when trackables change
    useEffect(() => {
        if (trackables.length > 0) {
            const initialData = { mood: formData.mood || '' }
            trackables.forEach(t => {
                // Only set default if not already present (to preserve loaded data)
                if (formData[t.id] === undefined) {
                    initialData[t.id] = (t.type === 'boolean' ? false : 0)
                }
            })
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [trackables])

    const handleInputChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()

        // Validation: Logic: Is there at least ONE thing filled?
        // mood check
        let hasMood = !!formData.mood

        // habit check (skip mood and skip notes)
        let hasHabit = false
        Object.entries(formData).forEach(([key, val]) => {
            if (key === 'mood' || key.endsWith('_note')) return
            if (val !== 0 && val !== false && val !== '') {
                hasHabit = true
            }
        })

        if (!hasMood && !hasHabit) {
            showToast('IDENTIFY_AT_LEAST_ONE_VIBE_TO_SYNC', 'warning')
            return
        }

        const success = await saveData(formData)
        if (success) {
            showToast('DATA_SYNCED_TO_CORE', 'success')
            fetchEntries()
        }
    }

    // Separated Save Logic
    const saveData = async (dataToSave) => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: dataToSave,
                    date: targetDate
                })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'SYNC_FAILED')
            }

            updateGamification(dataToSave)
            setLastSaved(new Date())
            refreshStats()
            return true
        } catch (e) {
            console.error('Sync failed:', e)
            showToast('SYNC_FAILED: CHECK_CONNECTION', 'xp')
            return false
        } finally {
            setIsSaving(false)
        }
    }

    const updateGamification = async (currentData) => {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const lastStr = userStats.lastLog ? new Date(userStats.lastLog).toISOString().split('T')[0] : null

        let newStreak = userStats.streak
        if (todayStr !== lastStr) {
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            if (lastStr === yesterdayStr) newStreak += 1
            else if (lastStr !== todayStr) newStreak = 1
        }

        let gainedXP = 1
        if (currentData.mood) gainedXP = 5

        const newXP = userStats.xp + gainedXP
        const newLevel = Math.floor(newXP / 100) + 1

        const newStats = {
            ...userStats,
            streak: newStreak,
            xp: newXP,
            level: newLevel,
            lastLog: today.toISOString()
        }

        if (newLevel > userStats.level) {
            showToast(`LEVEL UP! ${newLevel}`, 'xp')
        } else if (Math.random() > 0.8) {
            showToast(`+${gainedXP} XP`, 'xp')
        }

        setUserStats(newStats)
        // Sync with MongoDB
        await fetch('/api/user-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStats)
        })
    }

    const handleSaveTrackable = async (trackable) => {
        const existingIndex = trackables.findIndex(t => t.id === trackable.id)
        let updated
        if (existingIndex >= 0) {
            updated = [...trackables]
            updated[existingIndex] = trackable
        } else {
            updated = [...trackables, trackable]
        }
        setTrackables(updated)

        // Sync with MongoDB - Send as raw array
        await fetch('/api/trackables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        })

        setEditingItem(null)
    }

    const handleDelete = async (id) => {
        if (window.confirm('DELETE THIS HABIT?')) {
            const updated = trackables.filter(t => t.id !== id)
            setTrackables(updated)
            // Sync with MongoDB - Send as raw array
            await fetch('/api/trackables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            })
        }
    }

    const handleEditStart = (item) => {
        setEditingItem(item)
        setShowManager(true)
    }


    const categories = [...new Set(trackables.map(t => t.category))]
    const leftCategories = categories.filter((_, i) => i % 2 === 0)
    const rightCategories = categories.filter((_, i) => i % 2 !== 0)

    const handleDragOver = (event) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId !== overId) {
            setTrackables((items) => {
                const oldIndex = items.findIndex((i) => i.id === activeId)
                const overIndex = items.findIndex((i) => i.id === overId)

                if (overIndex === -1) return items // Over something not a trackable

                const activeItem = items[oldIndex]
                const overItem = items[overIndex]

                if (activeItem.category !== overItem.category) {
                    const newItems = [...items]
                    newItems[oldIndex] = { ...activeItem, category: overItem.category }
                    return arrayMove(newItems, oldIndex, overIndex)
                }

                return items
            })
        }
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!over) return

        if (active.id !== over.id) {
            setTrackables((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id)
                const newIndex = items.findIndex((i) => i.id === over.id)

                const newItems = arrayMove(items, oldIndex, newIndex)
                localStorage.setItem('mood_trackables', JSON.stringify(newItems))
                return newItems
            })
        }
    }

    // Helper to render Edit Controls
    const renderEditControls = (item) => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'flex-end' }}>
            <button
                type="button"
                onClick={() => handleEditStart(item)}
                style={{ background: 'var(--yellow)', border: '2px solid black', cursor: 'pointer', padding: '4px', color: 'black' }}
            >
                <Pencil size={12} />
            </button>
            <button
                type="button"
                onClick={() => handleDelete(item.id)}
                style={{ background: 'var(--pink)', border: '2px solid black', cursor: 'pointer', padding: '4px', color: 'white' }}
            >
                <Trash2 size={12} />
            </button>
        </div>
    )

    const renderTrackableItem = (item) => (
        <SortableHabit key={item.id} id={item.id} isEditMode={isEditMode}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
                {isEditMode && renderEditControls(item)}

                {/* TYPE: BOOLEAN */}
                {item.type === 'boolean' && (
                    <RetroToggle
                        label={item.name}
                        value={formData[item.id]}
                        onChange={(val) => handleInputChange(item.id, val)}
                    />
                )}

                {/* TYPE: TEXT */}
                {item.type === 'text' && (
                    <div style={{ marginBottom: '8px' }}>
                        <label className="control-label">{item.name}</label>

                        {/* OPTIONS (Multi-Select) */}
                        {item.options && item.options.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                {item.options.map(opt => {
                                    const currentVal = formData[item.id] || ''
                                    const isSelected = currentVal.includes(opt)
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                                let parts = currentVal ? currentVal.split(', ').filter(p => p.trim()) : []
                                                if (isSelected) {
                                                    parts = parts.filter(p => p !== opt)
                                                } else {
                                                    parts.push(opt)
                                                }
                                                handleInputChange(item.id, parts.join(', '))
                                            }}
                                            style={{
                                                flex: '1 0 auto',
                                                minWidth: '80px',
                                                background: isSelected ? 'var(--green)' : 'var(--card-bg)',
                                                color: isSelected ? 'black' : 'var(--text-color)',
                                                border: '3px solid black', padding: '12px 16px', fontSize: '0.9rem',
                                                cursor: 'pointer', fontWeight: '900', textTransform: 'uppercase',
                                                boxShadow: isSelected ? 'inset 3px 3px 0px rgba(0,0,0,0.2)' : '3px 3px 0px black',
                                                transform: isSelected ? 'translate(2px, 2px)' : 'none',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {(!item.options || item.options.length === 0) && (
                            <input
                                className="sidebar-btn"
                                style={{ cursor: 'text', border: '3px solid black', width: '100%', fontSize: '1rem', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                value={formData[item.id] || ''}
                                onChange={(e) => handleInputChange(item.id, e.target.value)}
                                placeholder="..."
                            />
                        )}
                    </div>
                )}

                {/* TYPE: NUMBER */}
                {item.type === 'number' && (
                    <Stepper
                        label={item.name}
                        value={formData[item.id]}
                        onChange={(val) => handleInputChange(item.id, val)}
                        suffix={item.unit || (item.name.includes('Time') ? 'MIN' : 'UNIT')}
                        max={(item.unit === 'HRS' || item.name.toLowerCase().includes('time')) ? 24 : Infinity}
                    />
                )}

                {/* TYPE: DATE */}
                {item.type === 'date' && (
                    <div style={{ marginBottom: '8px' }}>
                        <label className="control-label" style={{ display: 'block', marginBottom: '8px' }}>{item.name}</label>
                        <input
                            type="date"
                            className="sidebar-btn"
                            style={{
                                cursor: 'pointer',
                                border: '3px solid black',
                                width: '100%',
                                fontSize: '1rem',
                                padding: '12px',
                                background: 'var(--input-bg)',
                                color: 'var(--text-color)'
                            }}
                            value={formData[item.id] || ''}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                        />
                    </div>
                )}

                {/* DAILY NOTES */}
                {item.allowNotes && (
                    <div style={{ marginTop: '12px', marginLeft: '2px', marginRight: '2px', opacity: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Daily Note</p>
                            <div style={{ height: '2px', background: '#ddd', flex: 1 }}></div>
                        </div>
                        <textarea
                            className="sidebar-btn"
                            style={{
                                width: '100%', minHeight: '50px', fontSize: '0.85rem',
                                border: '2px solid black', resize: 'vertical', background: 'var(--input-bg)',
                                padding: '8px', fontFamily: 'inherit', boxShadow: 'none', color: 'var(--text-color)'
                            }}
                            placeholder={`...`}
                            value={formData[`${item.id}_note`] || ''}
                            onChange={(e) => handleInputChange(`${item.id}_note`, e.target.value)}
                        />
                    </div>
                )}
            </div>
        </SortableHabit>
    )

    if (!mounted) return null

    return (
        <div className="page-container">
            <Notifications />

            <TrackableManager
                isOpen={showManager}
                onClose={() => {
                    setShowManager(false)
                    setEditingItem(null)
                }}
                onSave={handleSaveTrackable}
                existingCategories={categories}
                initialData={editingItem}
            />

            <header className="dashboard-header">
                <div className="header-title-group">
                    <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>
                        {userStats.survivalMode ? 'SURVIVAL_PROTOCOL_ACTIVE' : (targetDate === new Date().toISOString().split('T')[0] ? 'DASHBOARD' : 'TEMPORAL_ARCHIVE')}
                    </p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>
                        {userStats.survivalMode ? "STAY_AFLOAT" : (targetDate === new Date().toISOString().split('T')[0] ? "TODAY'S LOG" : `LOG_${targetDate}`)}
                    </h2>
                </div>

                {userStats.survivalMode && (
                    <div style={{ background: 'var(--yellow)', border: '3px solid black', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '5px 5px 0px black', color: 'black' }}>
                        <LifeBuoy size={24} className="spin-slow" />
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900' }}>NON-PUNITIVE_PROGRESS_ON</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>STREAK_SHIELDED_v2.1</div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                    {lastSaved && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--green)', marginBottom: '12px' }}>
                            LAST_SYNC: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}

                    {/* EDIT MODE TOGGLE */}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`sidebar-btn ${isEditMode ? 'active' : ''}`}
                        style={{
                            background: isEditMode ? 'var(--text-color)' : 'var(--card-bg)',
                            color: isEditMode ? 'var(--bg-color)' : 'var(--text-color)',
                            border: '3px solid black',
                            fontSize: '0.65rem',
                            fontWeight: '900',
                            padding: '8px 16px',
                            whiteSpace: 'nowrap',
                            letterSpacing: '1px',
                            boxShadow: '4px 4px 0px black'
                        }}
                    >
                        {isEditMode ? <X size={14} /> : <Settings size={14} />} EDIT MODE
                    </button>

                    <button
                        onClick={() => setShowGoalManager(true)}
                        className="sidebar-btn"
                        style={{
                            background: 'var(--text-color)', color: 'var(--bg-color)', border: '3px solid black',
                            padding: '8px 12px', boxSizing: 'border-box', height: 'fit-content',
                            fontSize: '0.65rem', whiteSpace: 'nowrap', fontWeight: '900',
                            letterSpacing: '1px', boxShadow: '4px 4px 0px var(--btn-shadow)'
                        }}
                    >
                        <Target size={14} /> NEW QUEST
                    </button>

                    <button
                        onClick={() => {
                            setEditingItem(null)
                            setShowManager(true)
                        }}
                        className="sidebar-btn"
                        style={{
                            background: 'var(--yellow)', border: '2px solid black', padding: '8px 12px',
                            fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '4px 4px 0px var(--btn-shadow)', height: 'fit-content', opacity: 1, position: 'relative', zIndex: 10,
                            fontSize: '0.65rem', whiteSpace: 'nowrap', letterSpacing: '1px', color: 'black'
                        }}
                    >
                        <Plus size={14} strokeWidth={4} /> ADD HABIT
                    </button>

                    <div className="header-date-card" style={{ background: 'var(--card-bg)', border: userStats.volitionShield ? '4px solid var(--blue)' : '4px solid black' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px', borderRight: '2px solid #ddd', paddingRight: '8px' }}>
                            <span style={{ fontSize: '1.2rem', color: userStats.volitionShield ? 'var(--blue)' : 'var(--pink)' }}>
                                {userStats.volitionShield ? <ShieldAlert size={20} /> : <Flame size={20} fill="var(--pink)" />}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-color)' }}>{userStats.streak} DAY</span>
                        </div>
                        <Calendar size={20} />
                        <div>
                            <p style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                {targetDate && new Date(targetDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            {targetDate !== new Date().toISOString().split('T')[0] && (
                                <button
                                    onClick={() => router.push('/')}
                                    style={{ background: 'black', color: 'white', border: 'none', padding: '2px 8px', fontSize: '0.6rem', fontWeight: '900', cursor: 'pointer', marginTop: '4px', display: 'block' }}
                                >
                                    &gt; GO_TO_TODAY
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Compassionate Message for Gaps */}
            {targetDate === new Date().toISOString().split('T')[0] && !lastSaved && userStats.streak > 0 && (
                <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--card-bg)', border: '4px solid black', boxShadow: '10px 10px 0px var(--blue)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid black' }}>
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', textTransform: 'uppercase' }}>YOUR_PROGRESS_WAS_SAFELY_GUARDED_BESTIE.</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: '700' }}>System detected a gap in activity. Streaks were paused and preserved. Welcome back.</div>
                    </div>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <form onSubmit={handleSubmit} className="dashboard-row">

                    {/* LEFT COLUMN */}
                    <div className="col-left">
                        {/* 1. VIBE CHECK (Always First) */}
                        <section className="cyber-card">
                            <div className="cyber-header" style={{ backgroundColor: 'var(--green)', color: 'black' }}>Vibe Check</div>
                            {/* MOOD GRID */}
                            <div className="mood-grid">
                                {MOOD_OPTIONS.map(m => (
                                    <button
                                        key={m.label}
                                        type="button"
                                        onClick={() => handleInputChange('mood', m.label)}
                                        className={`mood-btn ${formData.mood === m.label ? 'active' : ''}`}
                                        style={{ backgroundColor: m.bg, color: m.color }}
                                    >
                                        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '50%' }}>{m.icon}</div>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase' }}>{m.label}</span>
                                        {formData.mood === m.label && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'black', padding: '4px', display: 'flex' }}>
                                                <Heart size={16} fill="white" color="white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* DYNAMIC LEFT CATEGORIES */}
                        {leftCategories.map(cat => (
                            <SortableContext
                                key={cat}
                                items={trackables.filter(t => t.category === cat).map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <section className="cyber-card">
                                    <div className="cyber-header" style={{ backgroundColor: 'var(--pink)', color: 'white' }}>{cat}</div>
                                    <div>
                                        {trackables.filter(t => t.category === cat).map(item => renderTrackableItem(item))}
                                    </div>
                                </section>
                            </SortableContext>
                        ))}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-right">

                        {/* ELYSIUM STATS (Skill-Sync Architecture) */}
                        <ElysiumStats stats={userStats.rpgStats} goals={userStats.goals} />

                        {/* DYNAMIC RIGHT CATEGORIES */}
                        {rightCategories.map(cat => (
                            <SortableContext
                                key={cat}
                                items={trackables.filter(t => t.category === cat).map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <section className="cyber-card">
                                    <div className="cyber-header" style={{ backgroundColor: 'var(--blue)', color: 'white' }}>{cat}</div>
                                    <div>
                                        {trackables.filter(t => t.category === cat).map(item => renderTrackableItem(item))}
                                    </div>
                                </section>
                            </SortableContext>
                        ))}

                        {/* LOG (Always Last) */}
                        <section className="cyber-card bg-black text-white" style={{ background: 'black', color: 'white' }}>
                            <div className="cyber-header bg-white text-black" style={{ background: 'white', color: 'black' }}>Sys_Log</div>
                            <div style={{ borderLeft: '4px solid #333', paddingLeft: '24px', marginLeft: '8px', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'monospace' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.5 }}>CORE_STABILITY:</span>
                                    <span style={{ color: 'var(--green)', fontWeight: '900', fontSize: '1.2rem' }}>{stats.stability}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.5 }}>ENTRIES_LOGGED:</span>
                                    <span style={{ color: 'var(--pink)', fontWeight: '900', fontSize: '1.2rem' }}>{stats.total}</span>
                                </div>
                                <div style={{ marginTop: '24px', padding: '16px', background: '#111', border: '1px solid #333', fontSize: '0.8rem', color: '#888' }}>
                                    &gt; Waiting for input...<br />
                                    &gt; Neural pathways online.
                                </div>
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="sync-btn"
                            style={{ '--btn-bg': isSaving ? '#ccc' : 'var(--green)' }}
                        >
                            {isSaving ? 'SYNCING_TO_CORE...' : 'SYNC TO MOOD CORE'}
                        </button>
                        <div style={{ height: '40px' }}></div>
                    </div>

                </form>
            </DndContext>

            {showGoalManager && (
                <GoalManager
                    trackables={trackables}
                    onSave={refreshStats}
                    onClose={() => setShowGoalManager(false)}
                />
            )}
        </div>
    )
}
