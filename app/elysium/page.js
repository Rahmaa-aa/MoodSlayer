'use client'
import React, { useState } from 'react'
import { useUser } from '../../context/UserContext'
import { RPG_STATS } from '@/lib/rpg-constants'
import { Target, Sword, Plus, Crown, Shield, User, Zap, Flame, Star, Activity, Trash2, Pencil, GripVertical, X, Settings, Heart, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { GoalManager } from '../../components/GoalManager'
import { ConfirmationModal } from '../../components/ConfirmationModal'
import { Notifications } from '../../components/Notifications'
import dynamic from 'next/dynamic'

// DND Kit Imports
const DndContext = dynamic(() => import('@dnd-kit/core').then(mod => mod.DndContext), { ssr: false })
const SortableContext = dynamic(() => import('@dnd-kit/sortable').then(mod => mod.SortableContext), { ssr: false })
const useSortable = dynamic(() => import('@dnd-kit/sortable').then(mod => mod.useSortable), { ssr: false })
const CSS = dynamic(() => import('@dnd-kit/utilities').then(mod => mod.CSS), { ssr: false })
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

function SortableQuestItem({ goal, onEdit, onDelete, isEditMode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal._id })

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        zIndex: isDragging ? 100 : 1,
        background: isDragging ? '#fff' : '#fcfcfc',
        padding: '16px', border: '2px solid black',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: isDragging ? '8px 8px 0px black' : `inset 4px 0 0 ${RPG_STATS[goal.category]?.color || 'black'}`,
        marginBottom: '12px',
        cursor: 'default',
        opacity: isDragging ? 0.8 : 1,
        position: 'relative'
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {isEditMode && (
                    <div {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                        <GripVertical size={20} style={{ opacity: 0.3 }} />
                    </div>
                )}
                <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>{goal.category} // PHASE_{goal.currentLevel}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>{goal.name}</div>
                </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                {isEditMode && (
                    <div style={{ display: 'flex', gap: '8px', marginRight: '10px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(goal._id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--pink)' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '80px', height: '6px', background: '#ddd', border: '1px solid black' }}>
                        <div style={{ width: `${goal.percent}%`, height: '100%', background: 'black' }} />
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '900' }}>{Math.round(goal.percent)}%</div>
                </div>
            </div>
        </div>
    )
}

export default function ElysiumPage() {
    const { userStats, setUserStats, trackables, refreshStats } = useUser()
    const [showGoalManager, setShowGoalManager] = useState(false)
    const [editingGoal, setEditingGoal] = useState(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [deletingGoalId, setDeletingGoalId] = useState(null)
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const executeDelete = async () => {
        if (!deletingGoalId) return
        try {
            const res = await fetch('/api/goals', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deletingGoalId })
            })
            if (res.ok) refreshStats()
        } catch (e) {
            console.error('Failed to delete goal', e)
        } finally {
            setDeletingGoalId(null)
        }
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = userStats.goals.findIndex(g => g._id === active.id)
            const newIndex = userStats.goals.findIndex(g => g._id === over.id)
            const newGoals = arrayMove(userStats.goals, oldIndex, newIndex)
            setUserStats({ ...userStats, goals: newGoals })
        }
    }

    const unlockables = [
        { id: 'THE_NEURAL_SCAVENGER', label: 'THE_NEURAL_SCAVENGER', minLevel: 1, type: 'TITLE', unlocked: true },
        { id: 'VOID_WALKER_SKIN', label: 'VOID_WALKER_SKIN', minLevel: 5, type: 'SKIN', unlocked: userStats.level >= 5 },
        { id: 'THE_STOIC_PROTOCOL', label: 'THE_STOIC_PROTOCOL', minLevel: 10, type: 'TITLE', unlocked: userStats.level >= 10 },
        { id: 'SLAYER_AURA_PRIME', label: 'SLAYER_AURA_PRIME', minLevel: 20, type: 'AURA', unlocked: userStats.level >= 20 },
    ]

    return (
        <div className="page-container">
            <Notifications />

            <header className="dashboard-header" style={{ marginBottom: '32px', paddingBottom: '16px' }}>
                <div className="header-title-group">
                    <p style={{ fontWeight: '900', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.5 }}>ELYSIUM_PROTOCOL // RPG_MODE</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
                        ELYSIUM<span style={{ color: 'var(--blue)' }}>_CORE</span>
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`sidebar-btn ${isEditMode ? 'active' : ''}`}
                        style={{
                            background: isEditMode ? 'black' : 'white',
                            color: isEditMode ? 'white' : 'black',
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
                        onClick={() => {
                            setEditingGoal(null)
                            setShowGoalManager(true)
                        }}
                        className="sidebar-btn"
                        style={{
                            background: 'var(--yellow)', color: 'black', border: '3px solid black',
                            padding: '8px 16px', fontWeight: '900', boxShadow: '4px 4px 0px black',
                            height: 'fit-content', width: 'fit-content',
                            flexShrink: 0, whiteSpace: 'nowrap', fontSize: '0.65rem', letterSpacing: '1px'
                        }}
                    >
                        <Plus size={14} strokeWidth={4} /> NEW QUEST
                    </button>
                </div>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isPanelCollapsed ? '1fr 40px' : '1fr 380px',
                gap: '32px',
                alignItems: 'start',
                transition: 'grid-template-columns 0.3s ease'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
                    {/* STAT MATRIX */}
                    <section>
                        <div className="cyber-header" style={{ marginBottom: '20px' }}>STAT_MATRIX_v2.0</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {Object.keys(RPG_STATS).map(key => {
                                const stat = (userStats.rpgStats && userStats.rpgStats[key]) || { level: 1, xp: 0 };
                                const progress = stat.xp % 100;
                                const config = RPG_STATS[key];

                                const StatIcon = {
                                    Activity: <Activity size={20} />,
                                    Zap: <Zap size={20} />,
                                    Users: <Users size={20} />,
                                    Star: <Star size={20} />,
                                    Heart: <Heart size={20} />,
                                    Shield: <Shield size={20} />
                                }[config.icon] || <Activity size={20} />

                                return (
                                    <div key={key} style={{
                                        background: 'white', border: '3px solid black', padding: '20px',
                                        position: 'relative', overflow: 'hidden', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', background: 'black', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: '2px solid black'
                                                }}>{StatIcon}</div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: (config.color === 'var(--black)' || config.color === '#444' || config.color === '#111') ? '#888' : 'rgba(0,0,0,0.7)', textTransform: 'uppercase' }}>{config.label}</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>LVL_{stat.level}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                fontWeight: '900',
                                                background: config.color,
                                                color: (config.color === 'var(--black)' || config.color === '#444' || config.color === '#111') ? 'white' : 'black',
                                                padding: '2px 8px',
                                                border: '2px solid black'
                                            }}>{progress}%</div>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: '#eee', border: '2px solid black', position: 'relative' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: config.color, borderRight: '2px solid black' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.4 }}>XP_SYNC_ACTIVE</span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.4 }}>{stat.xp} TOTAL</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* QUESTS SECTION WITH DND */}
                    <section className="cyber-card" style={{ background: 'white', border: '3px solid black' }}>
                        <div className="cyber-header" style={{ background: 'var(--blue)' }}>CURRENT_OBJECTIVES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '15px' }}>
                            {userStats.goals && userStats.goals.length > 0 ? (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={userStats.goals.map(g => g._id)} strategy={verticalListSortingStrategy}>
                                        {userStats.goals.map(goal => (
                                            <SortableQuestItem
                                                key={goal._id}
                                                goal={goal}
                                                isEditMode={isEditMode}
                                                onDelete={(id) => setDeletingGoalId(id)}
                                                onEdit={(g) => { setEditingGoal(g); setShowGoalManager(true); }}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #ccc', color: '#999', fontSize: '0.8rem' }}>
                                    &gt; TABULA RASA: No active quests found.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div style={{ position: 'relative' }}>
                    {/* Panel Toggle Handle */}
                    <button
                        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '-16px',
                            transform: 'translateY(-50%)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '3px solid black',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 100,
                            boxShadow: '4px 4px 0px black'
                        }}
                    >
                        {isPanelCollapsed ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
                    </button>

                    <div style={{ display: isPanelCollapsed ? 'none' : 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* CHARACTER PANEL */}
                        <section style={{ background: 'black', padding: '30px', border: '4px solid black', color: 'white', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-15px', right: '20px', background: 'var(--pink)', color: 'white', padding: '4px 12px', fontWeight: '900', fontSize: '0.6rem', border: '2px solid black' }}>AVATAR_v1.0</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '140px', height: '140px', background: '#111', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '8px 8px 0px rgba(255, 20, 147, 0.2)', marginBottom: '20px' }}>
                                    <User size={80} color="var(--pink)" strokeWidth={3} />
                                </div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0', textAlign: 'center' }}>{userStats.level >= 10 ? 'STOIC_LEGEND' : 'NEURAL_SCAVENGER'}</h3>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--green)', letterSpacing: '2px' }}>RANK: OMEGA</div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--blue)', letterSpacing: '2px' }}>LEVEL: {userStats.level}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '30px' }}>
                                    <div style={{ background: '#222', padding: '12px', border: '1px solid #444', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.5 }}>STREAK</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{userStats.streak}D</div>
                                    </div>
                                    <div style={{ background: '#222', padding: '12px', border: '1px solid #444', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.5 }}>TOTAL_XP</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{userStats.xp}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="cyber-card" style={{ background: 'white', border: '3px solid black' }}>
                            <div className="cyber-header">UNLOCK_TREE</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {unlockables.map(u => (
                                    <div key={u.id} style={{ padding: '12px', border: '2px solid black', background: u.unlocked ? 'white' : '#f0f0f0', opacity: u.unlocked ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ color: u.unlocked ? 'var(--yellow)' : '#ccc' }}>{u.unlocked ? <Crown size={18} fill="var(--yellow)" /> : <Shield size={18} />}</div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '900' }}>{u.label}</div>
                                            <div style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.6 }}>{u.type} // REQUIRE_LVL_{u.minLevel}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section style={{ background: '#050505', color: 'var(--blue)', padding: '24px', border: '3px solid black', fontFamily: 'monospace', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.2) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none' }}></div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '900', marginBottom: '12px', opacity: 0.5 }}>&gt; INLAND_EMPIRE_CONNECTED</div>
                            <div style={{ fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                                "{userStats.streak > 7 ? "The neural pathways are firing with prehistoric intensity." : "The fog is thick, but your sensors are calibrated."}"
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '0.6rem', textAlign: 'right', fontWeight: '900' }}>[AUDITORY_PROCESS_COMPLETE]</div>
                        </section>
                    </div>
                </div>
            </div>

            {showGoalManager && (
                <GoalManager
                    trackables={trackables}
                    initialData={editingGoal}
                    onSave={refreshStats}
                    onClose={() => { setShowGoalManager(false); setEditingGoal(null); }}
                />
            )}

            {deletingGoalId && (
                <ConfirmationModal
                    title="TERMINATE_DATA_STREAM?"
                    message="ARE_YOU_SURE_YOU_WANT_TO_PURGE_THIS_NEURAL_PATHWAY? THIS_ACTION_IS_IRREVERSIBLE."
                    confirmText="TERMINATE"
                    cancelText="ABORT"
                    severity="danger"
                    onConfirm={executeDelete}
                    onCancel={() => setDeletingGoalId(null)}
                />
            )}

            <Notifications />
        </div>
    )
}
