'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useUser } from '../../context/UserContext'
import { Sidebar } from '../../components/Sidebar'

// Dynamic imports for heavy charting components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })

import { Zap, Brain, Sparkles, TrendingUp, TrendingDown, Target, HelpCircle, CheckSquare, Square, Settings, Eye, EyeOff, Activity } from 'lucide-react'
import { prepareData, calculateCorrelations } from '../../lib/ml/preprocessor'
import NeuralGrid from '../../components/NeuralGrid'

import { calculateInfluence } from '../../lib/ml/xai'
import { detectAnomaly, identifyArchetype } from '../../lib/ml/insights'

export default function CyclesPage() {
    const { userStats } = useUser()
    const [history, setHistory] = useState([])
    const [trackables, setTrackables] = useState([])
    const [mounted, setMounted] = useState(false)

    // UI State
    const [isEditMode, setIsEditMode] = useState(false)
    const [visibleWidgets, setVisibleWidgets] = useState({
        predictors: true,
        vibe: true,
        forecaster: true,
        oracle: true,
        charts: true
    })
    const [chartType, setChartType] = useState('step') // 'step' or 'monotone'

    // ML State
    const [correlations, setCorrelations] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [confidence, setConfidence] = useState(0)
    const [predictionTarget, setPredictionTarget] = useState('moodScore')
    const [selectedPredictors, setSelectedPredictors] = useState([])
    const [isThinking, setIsThinking] = useState(false)
    const [influences, setInfluences] = useState({})
    const [synergyPair, setSynergyPair] = useState(null)
    const [anomaly, setAnomaly] = useState(null)
    const [archetype, setArchetype] = useState("NEURAL_WAITING")

    useEffect(() => {
        setMounted(true)

        // Load settings from localStorage
        const savedSettings = localStorage.getItem('mood_cycles_settings')
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings)
            if (parsed.visibleWidgets) setVisibleWidgets(parsed.visibleWidgets)
            if (parsed.chartType) setChartType(parsed.chartType)
        }

        refreshData()
    }, [])

    const refreshData = async () => {
        try {
            // 1. Fetch Trackables
            const resT = await fetch('/api/trackables')
            const parsedTrackables = await resT.json()

            if (Array.isArray(parsedTrackables) && parsedTrackables.length > 0) {
                setTrackables(parsedTrackables)
                setSelectedPredictors(parsedTrackables.map(t => t.id))
            }

            // 2. Fetch Entries
            const resE = await fetch('/api/entries')
            const data = await resE.json()

            if (Array.isArray(data)) {
                setHistory(data)
                if (parsedTrackables.length > 0) {
                    runAnalysis(data, parsedTrackables, 'moodScore', parsedTrackables.map(t => t.id))
                }
            }
        } catch (e) {
            console.error('Failed to load cycles data', e)
        }
    }

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('mood_cycles_settings', JSON.stringify({ visibleWidgets, chartType }))
        }
    }, [visibleWidgets, chartType, mounted])

    const runAnalysis = async (data, allDefinitions, target, selectedIds) => {
        if (!data || data.length < 3) return

        setIsThinking(true)
        // Reset analysis state to prevent old data from lingering during recompilation
        setPrediction(null)
        setConfidence(0)
        setCorrelations([])
        setInfluences({})
        setArchetype("NEURAL_RECOMPILING...")

        const prepared = prepareData(data, allDefinitions)

        if (prepared) {
            // 1. Calculate correlations FOR THE TARGET (Filtered by selection)
            const corrs = calculateCorrelations(prepared, target, selectedIds)
            setCorrelations(corrs)

            // 2. Synergy Detection: Find high correlation between ANY two habits (not target)
            if (selectedIds.length >= 2) {
                const synergyResults = []
                for (let i = 0; i < selectedIds.length; i++) {
                    for (let j = i + 1; j < selectedIds.length; j++) {
                        const s1 = selectedIds[i]
                        const s2 = selectedIds[j]
                        const c = calculateCorrelations(prepared, s1, [s2])
                        if (c.length > 0 && c[0].strength > 0.4) {
                            synergyResults.push({ p1: s1, p2: s2, strength: c[0].strength })
                        }
                    }
                }
                setSynergyPair(synergyResults.sort((a, b) => b.strength - a.strength)[0] || null)
            } else {
                setSynergyPair(null)
            }

            try {
                // Include Lags in Training Features
                const trainingFeatures = [
                    target,
                    `${target}_lag1`,
                    ...selectedIds,
                    ...selectedIds.map(id => `${id}_lag1`)
                ];

                const customPrepared = {
                    ...prepared,
                    features: trainingFeatures
                }
                const { trainPredictor } = await import('../../lib/ml/engine')
                const { prediction: pred, confidence: conf, model: trainedModel } = await trainPredictor(customPrepared, target)

                setPrediction(pred)
                setConfidence(conf)

                // 3. Local Explainability: Pass the trained model DIRECTLY to avoid shape mismatch
                if (trainedModel) {
                    const lastRow = prepared.rows[prepared.rows.length - 1];
                    const inputData = customPrepared.features.map(f => lastRow[f]);
                    const infls = await calculateInfluence(trainedModel, inputData, customPrepared.features, target);
                    setInfluences(infls);
                } else {
                    setInfluences({});
                }

                // 4. Proactive Insights: Anomaly Detection & Archetype Clustering
                const glitch = detectAnomaly(prepared.rows, customPrepared.features);
                setAnomaly(glitch);

                const vArchetype = identifyArchetype(prepared.rows, allDefinitions);
                setArchetype(vArchetype);
            } catch (e) {
                console.error("Analysis execution failed", e)
                setInfluences({});
            } finally {
                setIsThinking(false)
            }
        } else {
            setIsThinking(false)
        }
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

    const toggleWidget = (key) => {
        setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (!mounted) return null

    // Process Chart Data
    const moodMap = { 'Happy': 4, 'Energetic': 3, 'Chill': 2, 'Sad': 1 }
    const chartData = history.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
        moodScore: moodMap[entry.data?.mood] || 0,
        habits: Object.keys(entry.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note') && entry.data[k]).length
    })).reverse()

    // Aura Logic: Data Integrity First
    const getAura = () => {
        if (prediction === null || confidence < 0.2) return { name: 'UNCERTAIN', color: '#666', glow: 'none' }

        // If confidence is low, signal potential entropy
        if (confidence < 0.5) return { name: 'ERRATIC_AURA', color: '#888', glow: 'inset 0 0 20px rgba(255,0,0,0.1)' }

        if (predictionTarget === 'moodScore') {
            const scaled = prediction * 3 + 1
            if (scaled > 3.2) return { name: 'GOLDEN AURA', color: 'var(--yellow)', glow: '0 0 30px var(--yellow)' }
            if (scaled > 2.5) return { name: 'VIBRANT AURA', color: 'var(--green)', glow: '0 0 20px var(--green)' }
            if (scaled > 1.8) return { name: 'CHILL AURA', color: 'var(--blue)', glow: '0 0 20px var(--blue)' }
            return { name: 'LOW ENERGY', color: 'var(--pink)', glow: '0 0 20px var(--pink)' }
        }
        return { name: 'STABLE', color: 'var(--purple)', glow: '0 0 20px var(--purple)' }
    }
    const aura = getAura()



    // Group trackables by category for the selection UI
    const categories = [...new Set(trackables.map(t => t.category))]

    return (
        <div className="app-shell">
            <Sidebar activePage="Cycles" />

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                <header className="dashboard-header">
                    <div className="header-title-group">
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Brain className="text-pink" /> NEURAL_CYCLES
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isThinking && <span className="text-xs font-bold animate-pulse text-pink">ANALYZING_PATTERNS...</span>}

                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className="sidebar-btn"
                            style={{ width: 'auto', padding: '8px 16px', background: isEditMode ? 'var(--yellow)' : 'white' }}
                        >
                            <Settings size={16} /> {isEditMode ? 'SAVE_CONFIG' : 'CUSTOMISE'}
                        </button>
                    </div>
                </header>

                <NeuralGrid history={history} trackables={trackables} />

                {isEditMode && (
                    <section className="cyber-card" style={{ background: 'var(--yellow)', padding: '20px' }}>
                        <div className="cyber-header" style={{ background: 'black', color: 'white' }}>Layout_Config</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            {Object.keys(visibleWidgets).map(key => (
                                <button key={key} onClick={() => toggleWidget(key)} className="sidebar-btn" style={{ gap: '8px' }}>
                                    {visibleWidgets[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                                    {key.toUpperCase()}
                                </button>
                            ))}
                            <button onClick={() => setChartType(chartType === 'step' ? 'monotone' : 'step')} className="sidebar-btn" style={{ gap: '8px', background: 'white' }}>
                                <Zap size={16} /> {chartType.toUpperCase()}_LINES
                            </button>
                        </div>
                    </section>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr minmax(280px, 0.8fr)', gap: '20px', alignItems: 'start' }}>

                    {/* COL 1: PREDICTOR SELECTION (Customizable) */}
                    {visibleWidgets.predictors && (
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
                    )}

                    {/* COL 2: AURA & FORECASTER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {visibleWidgets.vibe && (
                            <section className="cyber-card" style={{ textAlign: 'center', padding: '40px 20px', background: 'white', position: 'relative' }}>
                                <div className="cyber-header" style={{ backgroundColor: 'black', color: 'white' }}>VIBE_PROJECTION</div>
                                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 8px', background: 'black', color: 'white', fontSize: '0.6rem', fontWeight: '900' }}>
                                    {archetype.replace('_', ' ')}
                                </div>
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
                        )}

                        {visibleWidgets.forecaster && (
                            <section className="cyber-card">
                                <div className="cyber-header" style={{ backgroundColor: 'var(--yellow)', color: 'black' }}>Neural_Forecaster</div>
                                <div style={{ padding: '20px' }}>

                                    {/* ANOMALY ALERT */}
                                    {anomaly && (
                                        <div style={{
                                            background: 'var(--pink)', color: 'white', padding: '16px', border: '3px solid black',
                                            marginBottom: '20px', position: 'relative', boxShadow: '4px 4px 0px black'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <Activity size={18} className="animate-pulse" />
                                                <span style={{ fontWeight: '900', fontSize: '0.8rem' }}>SYSTEM_GLITCH_DETECTED</span>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', margin: 0 }}>
                                                Unusual activity in <b>{trackables.find(t => t.id === anomaly.feature)?.name || anomaly.feature}</b> detected.
                                                Deviation: {anomaly.zScore.toFixed(1)}σ ({anomaly.severity}).
                                            </p>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '0.65rem', fontWeight: '900', display: 'block', marginBottom: '8px', opacity: 0.7, letterSpacing: '1px' }}>PRIMARY_TARGET (The "Subject"):</label>
                                        <select
                                            className="sidebar-btn"
                                            style={{ width: '100%', cursor: 'pointer', background: 'white', border: '3px solid black', fontWeight: '900', textTransform: 'uppercase' }}
                                            value={predictionTarget}
                                            onChange={(e) => handleTargetChange(e.target.value)}
                                        >
                                            <option value="moodScore">Overall Mood</option>
                                            {trackables.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* SYNERGY ALERT */}
                                    {synergyPair && (
                                        <div style={{
                                            background: 'black', color: 'var(--green)', padding: '16px', border: '2px solid var(--green)',
                                            marginBottom: '20px', position: 'relative'
                                        }}>
                                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', background: 'var(--green)', color: 'black', fontSize: '0.6rem', fontWeight: '900' }}>
                                                SYNERGY_DETECTED
                                            </div>
                                            <p style={{ fontSize: '0.7rem', margin: '0 0 4px 0', opacity: 0.8 }}>HIDDEN_LINK_FOUND:</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
                                                {trackables.find(t => t.id === synergyPair.p1)?.name} <Sparkles size={10} style={{ margin: '0 4px' }} /> {trackables.find(t => t.id === synergyPair.p2)?.name}
                                            </p>
                                            <p style={{ fontSize: '0.6rem', margin: '4px 0 0 0', fontStyle: 'italic', opacity: 0.7 }}>
                                                These habits co-occur with {Math.round(synergyPair.strength * 100)}% consistency.
                                            </p>
                                        </div>
                                    )}

                                    <div style={{ background: '#111', color: 'var(--green)', padding: '20px', fontFamily: 'monospace', fontSize: '0.85rem', border: '3px solid black', boxShadow: 'inset 0 0 10px rgba(0,255,0,0.1)', position: 'relative' }}>
                                        {isThinking && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1px' }}>
                                                NEURAL_RECOMPILING...
                                            </div>
                                        )}
                                        {anomaly && (
                                            <div style={{
                                                marginBottom: '12px',
                                                border: '2px solid var(--pink)',
                                                background: 'rgba(255, 0, 100, 0.1)',
                                                padding: '8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                animation: anomaly.severity === 'CRITICAL' ? 'blink 1s infinite' : 'none'
                                            }}>
                                                <div style={{ color: 'var(--pink)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                    [SYSTEM_GLITCH_DETECTED]
                                                </div>
                                                <div style={{ color: 'white', opacity: 0.8 }}>
                                                    SEVERITY: {anomaly.severity} (Z:{anomaly.zScore.toFixed(2)})<br />
                                                    FEATURE: {trackables.find(t => t.id === anomaly.feature)?.name || anomaly.feature.toUpperCase()}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ marginBottom: '8px', opacity: 0.5 }}>&gt; analyze --history --predictors={selectedPredictors.length}</div>
                                        <div style={{ marginBottom: '8px' }}>
                                            &gt; tomorrow_outlook: <span style={{ color: 'white', fontWeight: 'bold' }}>
                                                {(() => {
                                                    if (prediction === null) return '...';
                                                    if (predictionTarget === 'moodScore') return (prediction * 3 + 1).toFixed(2);

                                                    const targetDef = trackables.find(t => String(t.id) === String(predictionTarget));
                                                    const isNumber = targetDef?.type === 'number' || targetDef?.type === 'Number' || predictionTarget.includes('rotting');

                                                    if (isNumber) {
                                                        const val = predictionTarget === 'rotting_time' ? (prediction * 5) : (prediction * 10);
                                                        return `${val.toFixed(1)} ${targetDef?.unit || 'UNITS'}`;
                                                    }

                                                    const pct = Math.round(prediction * 100);
                                                    const color = pct >= 50 ? 'var(--green)' : 'var(--pink)';
                                                    return (
                                                        <>
                                                            {pct}%
                                                            <span style={{ color, fontSize: '0.7rem', marginLeft: '6px' }}>
                                                                ({pct >= 50 ? 'YES' : 'NO'})
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </span>
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>&gt; confidence_score: <span style={{ color: confidence > 0.7 ? 'var(--green)' : 'var(--yellow)', fontWeight: 'bold' }}>{confidence < 0.4 ? 'UNCERTAIN' : Math.round(confidence * 100) + '%'}</span></div>
                                        <div>&gt; engine_state: <span style={{ color: confidence > 0.4 ? 'var(--green)' : 'var(--pink)' }}>{confidence > 0.4 ? 'READY' : (confidence < 0.2 ? 'ENTROPY_DETECTED' : 'COLLECTING_DATA')}</span></div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* COL 3: THE ORACLE (INSIGHTS) */}
                    {visibleWidgets.oracle && (
                        <section className="cyber-card" style={{ height: '100%' }}>
                            <div className="cyber-header" style={{ backgroundColor: 'var(--pink)', color: 'white' }}>Oracle_Output</div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {correlations.length === 0 && (
                                    <div style={{ padding: '20px', border: '2px dashed var(--blue)', background: 'rgba(0,0,255,0.05)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--blue)', margin: '0 0 8px 0' }}>PERFECT_STABILITY_DETECTED</p>
                                        <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>Data variance is near zero. The AI identifies this as an ultra-consistent behavioral pattern, which prevents standard correlation bar displays.</p>
                                    </div>
                                )}
                                {correlations.map((corr, idx) => {
                                    // Helper to resolve labels for Lag Features
                                    const isLag = corr.feature.endsWith('_lag1');
                                    const baseId = isLag ? corr.feature.replace('_lag1', '') : corr.feature;
                                    const habit = baseId === 'moodScore' ? { name: 'MOOD' } : trackables.find(t => t.id === baseId);

                                    if (!habit) return null;

                                    const label = isLag ? `YESTERDAY'S_${habit.name}` : habit.name;

                                    // USE XAI Influence ONLY if it is significant (>10%)
                                    const influence = influences[corr.feature];
                                    const useInfluence = influence && influence.score > 0.1;

                                    const strength = useInfluence ? influence.score : corr.strength;
                                    const impact = useInfluence ? influence.impact : corr.impact;
                                    const showNeuralBadge = useInfluence;

                                    return (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            background: 'white', border: '2px solid black', padding: '12px',
                                            boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                                            opacity: selectedPredictors.includes(baseId) || baseId === 'moodScore' ? 1 : 0.6,
                                            position: 'relative'
                                        }}>
                                            {showNeuralBadge && (
                                                <div style={{
                                                    position: 'absolute', top: -10, right: 10, background: 'black', color: 'white',
                                                    fontSize: '0.45rem', padding: '2px 6px', fontWeight: '900', letterSpacing: '1px',
                                                    border: '1px solid black'
                                                }}>
                                                    NEURAL_WEIGHT
                                                </div>
                                            )}
                                            <div style={{
                                                padding: '6px', background: impact === 'positive' ? 'var(--green)' : 'var(--pink)',
                                                border: '2px solid black'
                                            }}>
                                                {impact === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', lineHeight: 1.1 }}>
                                                    {label}
                                                </p>
                                                <div style={{ width: '100%', height: '4px', background: '#eee', marginTop: '4px' }}>
                                                    <div style={{ width: `${Math.min(100, strength * 100)}%`, height: '100%', background: impact === 'positive' ? 'var(--green)' : 'var(--pink)' }}></div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '900', fontSize: '1rem', color: impact === 'positive' ? 'var(--green)' : 'var(--pink)' }}>
                                                {Math.round(strength * 100)}%
                                            </div>
                                        </div>
                                    );
                                })}

                                <div style={{ marginTop: '10px', padding: '12px', border: '1px dashed black', fontSize: '0.65rem', lineHeight: 1.4, opacity: 0.8 }}>
                                    <HelpCircle size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    The Oracle identifies patterns by comparing your <b>Primary Target</b> against selected <b>Predictors</b> over the last 30 days.
                                    {Object.keys(influences).length > 0 && (
                                        <div style={{ marginTop: '8px', padding: '8px', background: '#f9f9f9', border: '1px solid #ddd' }}>
                                            <b>EXPLAINER:</b> "Neural Weights" represent the direct influence each habit has on <i>tomorrow's specific prediction</i>, according to the neural network.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* VISUALS: WAVEFORMS */}
                {visibleWidgets.charts && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="cyber-card">
                            <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black', color: 'black' }}>Mood_Waveform</div>
                            <div style={{ height: '200px', padding: '16px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 4]} hide />
                                        <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px black' }} />
                                        <Line type={chartType} dataKey="moodScore" stroke="var(--pink)" strokeWidth={4} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="cyber-card">
                            <div className="cyber-header" style={{ background: 'white', borderBottom: '3px solid black', color: 'black' }}>Habit_Velocity</div>
                            <div style={{ height: '200px', padding: '16px' }}>
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
                )}
            </div>
        </div >
    )
}
