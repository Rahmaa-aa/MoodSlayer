'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { Zap, Brain, Sparkles, TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react'
import { prepareData, calculateCorrelations } from '../../lib/ml/preprocessor'
import { trainPredictor } from '../../lib/ml/engine'

export default function CyclesPage() {
    const [history, setHistory] = useState([])
    const [trackables, setTrackables] = useState([])
    const [mounted, setMounted] = useState(false)

    // ML State
    const [correlations, setCorrelations] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [predictionTarget, setPredictionTarget] = useState('moodScore')
    const [isThinking, setIsThinking] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Load data
        const savedTrackables = localStorage.getItem('mood_trackables')
        if (savedTrackables) setTrackables(JSON.parse(savedTrackables))

        fetch('/api/entries')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHistory(data)
                    runAnalysis(data, JSON.parse(savedTrackables || '[]'), 'moodScore')
                }
            })
            .catch(err => console.error(err))
    }, [])

    const runAnalysis = async (data, definitions, target) => {
        if (!data || data.length < 3) return

        setIsThinking(true)
        const prepared = prepareData(data, definitions)
        if (prepared) {
            // 1. Calculate Correlations
            const corrs = calculateCorrelations(prepared, target)
            setCorrelations(corrs)

            // 2. Run Prediction
            try {
                const pred = await trainPredictor(prepared, target)
                setPrediction(pred)
            } catch (e) {
                console.error("Prediction failed", e)
            }
        }
        setIsThinking(false)
    }

    const handleTargetChange = (newTarget) => {
        setPredictionTarget(newTarget)
        runAnalysis(history, trackables, newTarget)
    }

    if (!mounted) return null

    // Process Chart Data
    const moodMap = { 'Happy': 4, 'Energetic': 3, 'Chill': 2, 'Sad': 1 }
    const chartData = history.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
        moodScore: moodMap[entry.data?.mood] || 0,
        habits: Object.keys(entry.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note') && entry.data[k]).length
    })).reverse()

    // Aura Logic
    const getAura = () => {
        if (prediction === null) return { name: 'NEUTRAL', color: '#999', glow: 'none' }
        if (predictionTarget === 'moodScore') {
            if (prediction > 3.2) return { name: 'GOLDEN AURA', color: 'var(--yellow)', glow: '0 0 30px var(--yellow)' }
            if (prediction > 2.5) return { name: 'VIBRANT AURA', color: 'var(--green)', glow: '0 0 20px var(--green)' }
            if (prediction > 1.8) return { name: 'CHILL AURA', color: 'var(--blue)', glow: '0 0 20px var(--blue)' }
            return { name: 'LOW ENERGY', color: 'var(--pink)', glow: '0 0 20px var(--pink)' }
        }
        return { name: 'STABLE', color: 'var(--purple)', glow: '0 0 20px var(--purple)' }
    }
    const aura = getAura()

    // Get user stats for sidebar
    const savedStats = localStorage.getItem('mood_user_stats')
    const userStats = savedStats ? JSON.parse(savedStats) : { level: 1, xp: 0 }

    return (
        <div className="app-shell">
            <Sidebar userStats={userStats} activePage="Cycles" />

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Brain className="text-pink" /> CYCLES
                        </h2>
                    </div>
                    {isThinking && <span className="text-xs font-bold animate-pulse">ORACLE IS THINKING...</span>}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>

                    {/* LEFT: AURA & PREDICTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <section className="cyber-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div className="cyber-header" style={{ backgroundColor: 'black', color: 'white' }}>Current Aura</div>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 20px',
                                background: aura.color, boxShadow: aura.glow, border: '4px solid black',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Sparkles size={48} color="black" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: aura.color, WebkitTextStroke: '1px black' }}>{aura.name}</h3>
                            <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '8px' }}>PREDICTED STATE FOR TOMORROW</p>
                        </section>

                        <section className="cyber-card">
                            <div className="cyber-header" style={{ backgroundColor: 'var(--yellow)', color: 'black' }}>Neural Forecaster</div>
                            <div style={{ padding: '16px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', display: 'block', marginBottom: '8px' }}>I WANT TO PREDICT:</label>
                                <select
                                    className="sidebar-btn"
                                    style={{ width: '100%', cursor: 'pointer', marginBottom: '16px' }}
                                    value={predictionTarget}
                                    onChange={(e) => handleTargetChange(e.target.value)}
                                >
                                    <option value="moodScore">Overall Mood</option>
                                    {trackables.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>

                                <div style={{ background: 'black', color: 'var(--green)', padding: '16px', fontFamily: 'monospace', fontSize: '0.9rem', border: '2px solid #333' }}>
                                    &gt; Analyzing history...<br />
                                    &gt; Tomorrow's prediction: <span style={{ color: 'white' }}>{prediction !== null ? prediction.toFixed(2) : '---'}</span><br />
                                    &gt; Confidence: <span style={{ color: 'white' }}>{history.length > 10 ? 'HIGH' : 'LOW'}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT: THE ORACLE (CORRELATIONS) */}
                    <section className="cyber-card">
                        <div className="cyber-header" style={{ backgroundColor: 'var(--pink)', color: 'white' }}>The Oracle Insights</div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {correlations.length === 0 && <p className="text-center opacity-50 py-10">Need more data to find patterns...</p>}
                            {correlations.slice(0, 5).map((corr, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    background: 'white', border: '2px solid black', padding: '12px',
                                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{
                                        padding: '8px', background: corr.impact === 'positive' ? 'var(--green)' : 'var(--pink)',
                                        border: '2px solid black'
                                    }}>
                                        {corr.impact === 'positive' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {corr.feature === 'moodScore' ? 'MOOD' : trackables.find(t => t.id === corr.feature)?.name || corr.feature}
                                        </p>
                                        <p style={{ fontSize: '0.7rem' }}>
                                            {corr.impact === 'positive' ? 'Positive influence' : 'Negative influence'} on {predictionTarget === 'moodScore' ? 'Mood' : trackables.find(t => t.id === predictionTarget)?.name}
                                        </p>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>
                                        {Math.round(corr.strength * 100)}%
                                    </div>
                                </div>
                            ))}

                            {correlations.length > 0 && (
                                <div style={{ fontSize: '0.7rem', padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', marginTop: '12px' }}>
                                    <HelpCircle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    These percentages show how strongly a habit correlates with your {predictionTarget === 'moodScore' ? 'mood' : 'selected target'}.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* CHARTS SECTION */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="cyber-card">
                        <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black' }}>Mood Waveform</div>
                        <div style={{ height: '240px', padding: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 4]} hide />
                                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }} />
                                    <Line type="monotone" dataKey="moodScore" stroke="var(--pink)" strokeWidth={4} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="cyber-card">
                        <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black' }}>Habit Velocity</div>
                        <div style={{ height: '240px', padding: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }} />
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
