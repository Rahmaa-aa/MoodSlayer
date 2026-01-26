'use client'

import React, { useState, useEffect } from 'react'
import { Smile, CloudRain, Moon, Zap, Calendar, Heart, Activity, Plus, Pencil, Trash2, Settings, Flame } from 'lucide-react'
import { Sidebar } from '../components/Sidebar'
import { TrackableManager } from '../components/TrackableManager'
import { RetroToggle } from '../components/RetroToggle'
import { Stepper } from '../components/Stepper'
import { Notifications, showToast } from '../components/Notifications'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableHabit } from '../components/SortableHabit'

export default function Home() {
    // Default initial state
    const DEFAULT_TRACKABLES = [
        { id: 'gym', name: 'Gym', category: 'Health', type: 'boolean' },
        { id: 'water', name: 'Water (L)', category: 'Health', type: 'number', unit: 'L' },
        { id: 'reading', name: 'Reading', category: 'Mind', type: 'boolean' },
        { id: 'meditation', name: 'Meditation', category: 'Mind', type: 'number', unit: 'MIN' }
    ]

    const [trackables, setTrackables] = useState(DEFAULT_TRACKABLES)
    const [formData, setFormData] = useState({ mood: '' })
    const [stats, setStats] = useState({ total: 0, stability: 100 })
    const [isSaving, setIsSaving] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showManager, setShowManager] = useState(false)

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    // Gamification State
    const [userStats, setUserStats] = useState({ streak: 0, xp: 0, level: 1, lastLog: null })
    const [lastSaved, setLastSaved] = useState(null) // For auto-save indicator

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

    useEffect(() => {
        setMounted(true)

        // Load data from APIs
        const loadInitialData = async () => {
            try {
                // 1. Fetch Trackables
                const resT = await fetch('/api/trackables')
                const savedT = await resT.json()
                if (Array.isArray(savedT) && savedT.length > 0) {
                    setTrackables(savedT)
                } else {
                    setTrackables(DEFAULT_TRACKABLES)
                }

                // 2. Fetch User Stats
                const resS = await fetch('/api/user-stats')
                const stats = await resS.json()
                if (stats && !stats.error) {
                    const lastDate = stats.lastLog ? new Date(stats.lastLog) : null
                    const today = new Date()

                    if (lastDate) {
                        const diffTime = Math.abs(today - lastDate)
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        const todayStr = today.toISOString().split('T')[0]
                        const lastStr = stats.lastLog.split('T')[0]

                        if (lastStr !== todayStr && diffDays > 1) {
                            stats.streak = 0
                        }
                    }
                    setUserStats(stats)
                }

                // 3. Fetch Entries
                fetchEntries()
            } catch (e) {
                console.error('Failed to load initial data', e)
                setTrackables(DEFAULT_TRACKABLES)
            }
        }

        loadInitialData()
    }, [])

    // Initialize formData when trackables change
    useEffect(() => {
        if (trackables.length > 0) {
            const initialData = { mood: '' }
            trackables.forEach(t => {
                initialData[t.id] = formData[t.id] !== undefined ? formData[t.id] : (t.type === 'boolean' ? false : 0)
            })
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [trackables])

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/entries')
            const data = await res.json()
            if (Array.isArray(data)) {
                const happyCount = data.filter(e => e.data?.mood === 'Happy').length
                const total = data.length
                const stability = total > 0 ? Math.round((happyCount / total) * 100) : 100
                setStats({ total, stability })
            }
        } catch (e) { console.error('Failed to fetch entries') }
    }

    const handleInputChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    // Auto-Save Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (Object.keys(formData).length > 1) { // More than just {mood: ''}
                saveData(formData)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [formData])

    // Separated Save Logic
    const saveData = async (dataToSave) => {
        if (!dataToSave.mood && Object.keys(dataToSave).length <= 1) return

        setIsSaving(true)
        try {
            await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataToSave })
            })
            updateGamification(dataToSave)
            setLastSaved(new Date())
        } catch (e) { console.error('Auto-save failed') }
        setIsSaving(false)
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

        // Sync with MongoDB
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
            // Sync with MongoDB
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!formData.mood) {
            showToast('SELECT A MOOD FIRST!', 'xp')
            return
        }

        setIsSaving(true)
        try {
            await saveData(formData)
            showToast('NEURAL UPLINK COMPLETE!', 'info')
            fetchEntries()
        } catch (e) {
            showToast('UPLINK FAILED', 'xp')
        }
        setIsSaving(false)
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
                style={{ background: 'var(--yellow)', border: '2px solid black', cursor: 'pointer', padding: '4px' }}
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
                                                background: isSelected ? 'var(--green)' : 'white',
                                                color: 'black',
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
                                style={{ cursor: 'text', border: '3px solid black', width: '100%', fontSize: '1rem' }}
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
                    />
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
                                border: '2px solid black', resize: 'vertical', background: 'white',
                                padding: '8px', fontFamily: 'inherit', boxShadow: 'none'
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
        <div className="app-shell">
            <Notifications />
            <Sidebar userStats={userStats} activePage="Dashboard" />

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

            <main className="main-content">

                {/* 1. DASHBOARD HEADER */}
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>DASHBOARD</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>TODAY'S LOG</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                        {lastSaved && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--green)', marginBottom: '12px' }}>
                                AUTOSAVED {lastSaved.toLocaleTimeString()}
                            </span>
                        )}

                        {/* EDIT MODE TOGGLE */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            style={{
                                background: isEditMode ? 'black' : 'white',
                                color: isEditMode ? 'white' : 'black',
                                border: '2px solid black', padding: '8px 12px',
                                fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '4px 4px 0px black', height: 'fit-content'
                            }}
                        >
                            <Settings size={16} strokeWidth={4} /> {isEditMode ? 'DONE' : 'EDIT MODE'}
                        </button>

                        <button
                            onClick={() => {
                                setEditingItem(null)
                                setShowManager(true)
                            }}
                            style={{
                                background: 'var(--yellow)', border: '2px solid black', padding: '8px 12px',
                                fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '4px 4px 0px black', height: 'fit-content', opacity: 1, position: 'relative', zIndex: 10
                            }}
                        >
                            <Plus size={16} strokeWidth={4} /> ADD HABIT
                        </button>

                        <div className="header-date-card">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px', borderRight: '2px solid #ddd', paddingRight: '8px' }}>
                                <span style={{ fontSize: '1.2rem', color: 'var(--pink)' }}><Flame size={20} fill="var(--pink)" /></span>
                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'black' }}>{userStats.streak} DAY</span>
                            </div>
                            <Calendar size={20} />
                            <div>
                                <p style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

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
                            >
                                {isSaving ? 'SYNCING...' : 'CONFIRM SYNC'}
                            </button>
                            <div style={{ height: '40px' }}></div>
                        </div>

                    </form>
                </DndContext>

            </main>
        </div>
    )
}
