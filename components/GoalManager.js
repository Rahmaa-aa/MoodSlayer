'use client'
import React, { useState, useEffect } from 'react'
import { Plus, X, Target, Link as LinkIcon, ChevronRight, Activity, Zap, Users, Star, Heart, Shield, Sparkles } from 'lucide-react'
import { RPG_STATS } from '@/lib/rpg-constants'
import { showToast } from './Notifications'

export function GoalManager({ trackables, onSave, onClose, initialData = null }) {
    const [name, setName] = useState('')
    const [category, setCategory] = useState('PHYSICAL')
    const [linkedHabits, setLinkedHabits] = useState([])
    const [conditions, setConditions] = useState({}) // { habitId: { operator, value } }
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '')
            setCategory(initialData.category || 'PHYSICAL')
            setLinkedHabits(initialData.linkedHabits || [])
            setConditions(initialData.conditions || {})
        } else {
            setName('')
            setCategory('PHYSICAL')
            setLinkedHabits([])
            setConditions({})
        }
    }, [initialData])

    const QUEST_INSPO = [
        { name: 'Slay the Screen Demon', category: 'MENTAL', linked: ['doomscrolling'] },
        { name: 'Zen Master Protocol', category: 'EMOTIONAL', linked: ['daily_mantra'] },
        { name: 'Touch Grass Initiative', category: 'SURVIVAL', linked: ['touch_grass'] },
        { name: 'Main Character Arc', category: 'SOCIAL', linked: ['yap_session'] },
        { name: 'The Great Hydration', category: 'PHYSICAL', linked: ['hydration_check'] },
        { name: 'Creative Flow State', category: 'CREATIVE', linked: ['crochet'] }
    ]

    const handleInspire = () => {
        const random = QUEST_INSPO[Math.floor(Math.random() * QUEST_INSPO.length)]
        setName(random.name)
        setCategory(random.category)

        // Find existing trackables that match inspo tags if possible
        const possibleHabits = trackables.filter(t =>
            random.linked.some(l => t.id.includes(l) || t.name.toLowerCase().includes(l))
        )

        if (possibleHabits.length > 0) {
            const h = possibleHabits[0]
            setLinkedHabits([h.id])
            let defaultCondition = { operator: '==', value: true }
            if (h.type === 'number') defaultCondition = { operator: '>', value: 1 }
            setConditions({ [h.id]: defaultCondition })
        }
    }

    const getIcon = (iconName) => {
        const icons = {
            Activity: <Activity size={18} />,
            Zap: <Zap size={18} />,
            Users: <Users size={18} />,
            Star: <Star size={18} />,
            Heart: <Heart size={18} />,
            Shield: <Shield size={18} />
        }
        return icons[iconName] || <Activity size={18} />
    }

    const toggleHabit = (habit) => {
        const id = habit.id
        if (linkedHabits.includes(id)) {
            setLinkedHabits(linkedHabits.filter(h => h !== id))
            const newConditions = { ...conditions }
            delete newConditions[id]
            setConditions(newConditions)
        } else {
            setLinkedHabits([...linkedHabits, id])
            let defaultCondition = { operator: '==', value: true }
            if (habit.type === 'number') defaultCondition = { operator: '>', value: 5 }
            if (habit.type === 'text' && habit.options?.length > 0) defaultCondition = { operator: '==', value: habit.options[0] }

            setConditions({ ...conditions, [id]: defaultCondition })
        }
    }

    const updateCondition = (id, field, value) => {
        setConditions({
            ...conditions,
            [id]: { ...conditions[id], [field]: value }
        })
    }

    const handleSave = async () => {
        if (!name || linkedHabits.length === 0) {
            showToast('FILL IT OUT BESTIE!', 'warning')
            return
        }
        setIsSaving(true)
        try {
            const url = '/api/goals'
            const method = initialData?._id ? 'PATCH' : 'POST'
            const body = { name, category, linkedHabits, conditions }
            if (initialData?._id) body.id = initialData._id

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                onSave()
                onClose()
            }
        } catch (e) {
            console.error('Failed to save goal', e)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div className="cyber-card" style={{ width: '400px', maxWidth: '90%', background: 'white', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div className="cyber-header" style={{ marginBottom: 0, background: 'var(--purple)', color: 'white' }}>
                        {initialData ? 'EDIT_QUEST' : 'INITIALIZE_QUEST'}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* QUEST INSPO */}
                    <button
                        onClick={handleInspire}
                        className="sidebar-btn"
                        style={{ justifyContent: 'center', background: 'var(--yellow)', borderStyle: 'dashed' }}
                    >
                        <Sparkles size={16} /> QUEST INSPO ✨
                    </button>

                    {/* Quest Name */}
                    <div>
                        <label className="control-label">QUEST_NAME</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Slay the Screen Demon"
                            className="sidebar-btn"
                            style={{ width: '100%', cursor: 'text', border: '3px solid black' }}
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="control-label">NEURAL_DOMAIN</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {Object.values(RPG_STATS).map(stat => (
                                <button
                                    key={stat.id}
                                    onClick={() => setCategory(stat.id)}
                                    style={{
                                        background: category === stat.id ? stat.color : 'white',
                                        border: '3px solid black', padding: '8px 2px', fontSize: '0.6rem',
                                        fontWeight: '900', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                        boxShadow: category === stat.id ? 'inset 2px 2px 0px rgba(0,0,0,0.2)' : '3px 3px 0px black'
                                    }}
                                >
                                    {getIcon(stat.icon)}
                                    {stat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Link Habits & Conditions */}
                    <div>
                        <label className="control-label">SUCCESS_CRITERIA</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {trackables.map(t => {
                                const isSelected = linkedHabits.includes(t.id)
                                return (
                                    <div key={t.id} style={{ border: '2px solid black' }}>
                                        <button
                                            onClick={() => toggleHabit(t)}
                                            style={{
                                                width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px',
                                                background: isSelected ? 'var(--green)' : 'white',
                                                border: 'none', borderBottom: isSelected ? '2px solid black' : 'none',
                                                cursor: 'pointer', textAlign: 'left',
                                                fontSize: '0.75rem', fontWeight: '900'
                                            }}
                                        >
                                            <span>{t.name.toUpperCase()}</span>
                                            {isSelected ? <ChevronRight size={14} /> : <Plus size={14} />}
                                        </button>

                                        {isSelected && conditions[t.id] && (
                                            <div style={{ padding: '10px', background: '#f8f8f8', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {/* BOOLEAN LOGIC */}
                                                {t.type === 'boolean' && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => updateCondition(t.id, 'value', true)}
                                                            className="badge"
                                                            style={{ padding: '2px 6px', fontSize: '0.6rem', background: conditions[t.id].value === true ? 'black' : 'white', color: conditions[t.id].value === true ? 'white' : 'black', cursor: 'pointer' }}
                                                        >YES</button>
                                                        <button
                                                            onClick={() => updateCondition(t.id, 'value', false)}
                                                            className="badge"
                                                            style={{ padding: '2px 6px', fontSize: '0.6rem', background: conditions[t.id].value === false ? 'black' : 'white', color: conditions[t.id].value === false ? 'white' : 'black', cursor: 'pointer' }}
                                                        >NO</button>
                                                    </div>
                                                )}

                                                {/* NUMBER LOGIC */}
                                                {t.type === 'number' && (
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <select
                                                            value={conditions[t.id].operator}
                                                            onChange={(e) => updateCondition(t.id, 'operator', e.target.value)}
                                                            style={{ padding: '2px', border: '1px solid black', fontWeight: '900', fontSize: '0.65rem' }}
                                                        >
                                                            <option value="<">&lt;</option>
                                                            <option value=">">&gt;</option>
                                                            <option value="==">=</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            value={conditions[t.id].value}
                                                            onChange={(e) => updateCondition(t.id, 'value', e.target.value)}
                                                            style={{ width: '40px', padding: '2px', border: '1px solid black', fontWeight: '900', fontSize: '0.65rem' }}
                                                        />
                                                        <span style={{ fontSize: '0.55rem', fontWeight: '900' }}>{t.unit}</span>
                                                    </div>
                                                )}

                                                {/* TEXT/SELECT LOGIC */}
                                                {t.type === 'text' && (
                                                    <select
                                                        value={conditions[t.id].value}
                                                        onChange={(e) => updateCondition(t.id, 'value', e.target.value)}
                                                        style={{ padding: '2px', border: '1px solid black', fontWeight: '900', fontSize: '0.65rem', maxWidth: '100px' }}
                                                    >
                                                        {t.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                        ))}
                                                        {!t.options && <option value="">ANY</option>}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="sync-btn"
                        style={{ marginTop: '8px', padding: '12px', background: 'black', color: 'white', fontSize: '0.9rem' }}
                    >
                        {isSaving ? 'BOOTING...' : initialData ? 'UPDATE_QUEST' : 'LAUNCH_QUEST'}
                    </button>
                </div>
            </div>
        </div>
    )
}
