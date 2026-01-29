import React from 'react'
import { RPG_STATS } from '@/lib/rpg-constants'
import { Activity, Zap, Users, Star, Heart, Shield } from 'lucide-react'

export function ElysiumStats({ stats, goals }) {
    if (!stats) return null;

    const getIcon = (iconName) => {
        const icons = {
            Activity: <Activity size={14} />,
            Zap: <Zap size={14} />,
            Users: <Users size={14} />,
            Star: <Star size={14} />,
            Heart: <Heart size={14} />,
            Shield: <Shield size={14} />
        }
        return icons[iconName] || <Activity size={14} />
    }

    return (
        <section className="cyber-card" style={{ background: '#050505', color: 'white', border: '3px solid white' }}>
            <div className="cyber-header" style={{ background: 'white', color: 'black' }}>ELYSIUM_STATS</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                {Object.keys(RPG_STATS).map(key => {
                    const stat = stats[key] || { level: 1, xp: 0 };
                    const progress = stat.xp % 100;

                    return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '900' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {getIcon(RPG_STATS[key].icon)}
                                    {RPG_STATS[key].label}
                                </span>
                                <span style={{ color: RPG_STATS[key].color }}>LVL_{stat.level}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#222', border: '1px solid #444', position: 'relative' }}>
                                <div
                                    style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: RPG_STATS[key].color,
                                        boxShadow: `0 0 10px ${RPG_STATS[key].color}`
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {goals && goals.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid #333', paddingTop: '16px' }}>
                    <div className="control-label" style={{ color: 'white', opacity: 0.6, fontSize: '0.6rem' }}>ACTIVE_QUESTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        {goals.map(goal => (
                            <div key={goal._id} style={{ background: '#111', padding: '8px', borderLeft: `4px solid ${RPG_STATS[goal.category]?.color || 'white'}` }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {goal.name}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', opacity: 0.8 }}>
                                    <span>PROGRESS: {Math.round(goal.percent)}%</span>
                                    <span>LVL_{goal.currentLevel} / {goal.targetLevel}</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#000', marginTop: '4px' }}>
                                    <div style={{ width: `${goal.percent}%`, height: '100%', background: 'white' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
