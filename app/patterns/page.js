'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

export default function PatternsPage() {
    const [history, setHistory] = useState([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetch('/api/entries')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data)
            })
            .catch(err => console.error(err))
    }, [])

    if (!mounted) return null

    // Process Data
    const chartData = history.map(entry => {
        const moodMap = { 'Happy': 3, 'Energetic': 3, 'Chill': 2, 'Sad': 1 }

        let habitCount = 0
        if (entry.data) {
            Object.keys(entry.data).forEach(key => {
                if (key !== 'mood' && !key.endsWith('_note') && entry.data[key]) {
                    if (typeof entry.data[key] === 'boolean' && entry.data[key]) habitCount++
                    else if (typeof entry.data[key] === 'number' && entry.data[key] > 0) habitCount++
                    else if (typeof entry.data[key] === 'string' && entry.data[key].length > 0) habitCount++
                }
            })
        }

        return {
            date: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
            moodScore: moodMap[entry.data?.mood] || 0,
            moodLabel: entry.data?.mood,
            habits: habitCount
        }
    }).reverse()

    // Get stats from localStorage for sidebar
    const savedStats = typeof window !== 'undefined' ? localStorage.getItem('mood_user_stats') : null
    const userStats = savedStats ? JSON.parse(savedStats) : { level: 1, xp: 0 }

    return (
        <div className="app-shell">
            <Sidebar userStats={userStats} activePage="Patterns" />

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' }}>PATTERNS</h2>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                    {/* MOOD CHART */}
                    <div>
                        <h3 className="text-xl" style={{ borderLeft: '4px solid var(--pink)', paddingLeft: '8px', marginBottom: '16px' }}>MOOD WAVEFORM</h3>
                        <div style={{ height: '300px', width: '100%', background: 'white', border: '3px solid black', padding: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis domain={[0, 4]} hide />
                                    <Tooltip
                                        contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }}
                                        labelStyle={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Line type="monotone" dataKey="moodScore" stroke="var(--pink)" strokeWidth={3} dot={{ stroke: 'black', strokeWidth: 2, fill: 'white', r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* HABIT CHART */}
                    <div>
                        <h3 className="text-xl" style={{ borderLeft: '4px solid var(--green)', paddingLeft: '8px', marginBottom: '16px' }}>HABIT VELOCITY</h3>
                        <div style={{ height: '300px', width: '100%', background: 'white', border: '3px solid black', padding: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }}
                                    />
                                    <Bar dataKey="habits" fill="var(--green)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
