'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { Zap, Brain, Sparkles, TrendingUp, TrendingDown, Target, HelpCircle, CheckSquare, Square } from 'lucide-react'
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
    const [selectedPredictors, setSelectedPredictors] = useState([]) // New: Multi-habit selection
    const [isThinking, setIsThinking] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Load data
        const savedTrackables = localStorage.getItem('mood_trackables')
        const parsedTrackables = savedTrackables ? JSON.parse(savedTrackables) : []
        setTrackables(parsedTrackables)
        // Default to all predictors initially
        setSelectedPredictors(parsedTrackables.map(t => t.id))

        fetch('/api/entries')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHistory(data)
                    runAnalysis(data, parsedTrackables, 'moodScore', parsedTrackables.map(t => t.id))
                }
            })
            .catch(err => console.error(err))
    }, [])

    const runAnalysis = async (data, allDefinitions, target, selectedIds) => {
        if (!data || data.length < 3) return

        setIsThinking(true)
        // Filter definitions based on selection
        const filteredDefinitions = allDefinitions.filter(d => selectedIds.includes(d.id))
        const prepared = prepareData(data, allDefinitions) // Still prepare all for correlation matrix

        if (prepared) {
            // 1. Calculate Correlations (Always show top 5 from all features)
            const corrs = calculateCorrelations(prepared, target)
            setCorrelations(corrs)

            // 2. Run Prediction (Only using selected predictors)
            try {
                // We need to modify prepared data or trainPredictor to only use selected features
                // For now, let's filter the 'features' in prepared to match selection
                const customPrepared = {
                    ...prepared,
                    features: [target, ...selectedIds]
                }
                const pred = await trainPredictor(customPrepared, target)
                setPrediction(pred)
            } catch (e) {
                console.error("Prediction failed", e)
            }
        }
        setIsThinking(false)
    }

    const handleTargetChange = (newTarget) => {
        setPredictionTarget(newTarget)
        runAnalysis(history, trackables, newTarget, selectedPredictors)
    }

    const togglePredictor = (id) => {
        const newSelection = selectedPredictors.includes(id)
            ? selectedPredictors.filter(pid => pid !== id)
            : [...selectedPredictors, id]
        setSelectedPredictors(newSelection)
        runAnalysis(history, trackables, predictionTarget, newSelection)
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

    // Get user stats for sidebar navigation only
    const savedStats = localStorage.getItem('mood_user_stats')
    const userStats = savedStats ? JSON.parse(savedStats) : { level: 1, xp: 0 }

    // Group trackables by category for the selection UI
    const categories = [...new Set(trackables.map(t => t.category))]

    return (
        <div className="app-shell">
            <Sidebar userStats={userStats} activePage="Cycles" />

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Brain className="text-pink" /> NEURAL_CYCLES
                        </h2>
                    </div>
                    {isThinking && <span className="text-xs font-bold animate-pulse text-pink">ANALYZING_PATTERNS...</span>}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr minmax(280px, 0.8fr)', gap: '20px', alignItems: 'start' }}>

                    {/* COL 1: PREDICTOR SELECTION (Customizable) */}
                    <section className="cyber-card" style={{ height: '100%' }}>
                        <div className="cyber-header" style={{ backgroundColor: 'var(--blue)', color: 'white' }}>Select_Predictors</div>
                        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '600px' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.6, marginBottom: '12px', textTransform: 'uppercase' }}>Pick habits for analysis:</p>
                            {categories.map(cat => (
                                <div key={cat} style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--blue)', borderBottom: '2px solid #ddd', marginBottom: '8px', paddingBottom: '4px' }}>{cat}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {trackables.filter(t => t.category === cat).map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => togglePredictor(t.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none',
                                                    cursor: 'pointer', textAlign: 'left', padding: '4px 0',
                                                    color: selectedPredictors.includes(t.id) ? 'black' : '#999',
                                                    fontWeight: selectedPredictors.includes(t.id) ? '900' : 'normal',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {selectedPredictors.includes(t.id) ? <CheckSquare size={16} color="var(--blue)" /> : <Square size={16} />}
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* COL 2: AURA & FORECASTER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <section className="cyber-card" style={{ textAlign: 'center', padding: '40px 20px', background: 'white' }}>
                            <div className="cyber-header" style={{ backgroundColor: 'black', color: 'white' }}>VIBE_PROJECTION</div>
                            <div style={{
                                width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 24px',
                                background: aura.color, boxShadow: aura.glow, border: '5px solid black',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.5s ease'
                            }}>
                                <Sparkles size={60} color="black" />
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: aura.color, WebkitTextStroke: '1px black', margin: 0 }}>{aura.name}</h3>
                            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.5 }}>TOMORROW'S PREDICTED STATE</p>
                        </section>

                        <section className="cyber-card">
                            <div className="cyber-header" style={{ backgroundColor: 'var(--yellow)', color: 'black' }}>Neural_Forecaster</div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '900', display: 'block', marginBottom: '8px', opacity: 0.7 }}>PRIMARY TARGET:</label>
                                    <select
                                        className="sidebar-btn"
                                        style={{ width: '100%', cursor: 'pointer', background: 'white', border: '3px solid black', fontWeight: '900' }}
                                        value={predictionTarget}
                                        onChange={(e) => handleTargetChange(e.target.value)}
                                    >
                                        <option value="moodScore">Overall Mood</option>
                                        {trackables.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ background: '#111', color: 'var(--green)', padding: '20px', fontFamily: 'monospace', fontSize: '0.9rem', border: '3px solid black', boxShadow: 'inset 0 0 10px rgba(0,255,0,0.2)' }}>
                                    <div style={{ marginBottom: '8px' }}>&gt; analyze --history --predictors={selectedPredictors.length}</div>
                                    <div style={{ marginBottom: '8px' }}>&gt; target_prediction: <span style={{ color: 'white', fontWeight: 'bold' }}>{prediction !== null ? prediction.toFixed(2) : 'CALCULATING...'}</span></div>
                                    <div>&gt; confidence_score: <span style={{ color: history.length > 7 ? 'var(--green)' : 'var(--pink)' }}>{history.length > 7 ? 'NOMINAL' : 'INSUFFICIENT_DATA'}</span></div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COL 3: THE ORACLE (INSIGHTS) */}
                    <section className="cyber-card" style={{ height: '100%' }}>
                        <div className="cyber-header" style={{ backgroundColor: 'var(--pink)', color: 'white' }}>Oracle_Output</div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {correlations.length === 0 && <p className="text-center opacity-50 py-10" style={{ fontSize: '0.8rem' }}>Waiting for neural uplink...</p>}
                            {correlations.slice(0, 6).map((corr, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    background: 'white', border: '2px solid black', padding: '12px',
                                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{
                                        padding: '6px', background: corr.impact === 'positive' ? 'var(--green)' : 'var(--pink)',
                                        border: '2px solid black'
                                    }}>
                                        {corr.impact === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                                            {corr.feature === 'moodScore' ? 'MOOD' : trackables.find(t => t.id === corr.feature)?.name}
                                        </p>
                                        <div style={{ width: '100%', height: '4px', background: '#eee', marginTop: '4px' }}>
                                            <div style={{ width: `${Math.min(100, corr.strength * 100)}%`, height: '100%', background: corr.impact === 'positive' ? 'var(--green)' : 'var(--pink)' }}></div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '1rem', color: corr.impact === 'positive' ? 'var(--green)' : 'var(--pink)' }}>
                                        {Math.round(corr.strength * 100)}%
                                    </div>
                                </div>
                            ))}

                            <div style={{ marginTop: '10px', padding: '12px', border: '1px dashed black', fontSize: '0.65rem', lineHeight: 1.4, opacity: 0.8 }}>
                                <HelpCircle size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Higher percentages indicate a stronger relationship between the habit and your {predictionTarget === 'moodScore' ? 'mood' : 'target'}.
                            </div>
                        </div>
                    </section>
                </div>

                {/* VISUALS: WAVEFORMS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="cyber-card">
                        <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black' }}>Mood_Waveform</div>
                        <div style={{ height: '200px', padding: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 4]} hide />
                                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }} />
                                    <Line type="step" dataKey="moodScore" stroke="var(--pink)" strokeWidth={4} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="cyber-card">
                        <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black' }}>Habit_Velocity</div>
                        <div style={{ height: '200px', padding: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
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
