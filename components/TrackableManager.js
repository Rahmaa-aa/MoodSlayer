import { useState, useEffect } from 'react'
import { X, Sparkles, Plus, Save } from 'lucide-react'
import { showToast } from './Notifications'

export function TrackableManager({ isOpen, onClose, onSave, existingCategories, initialData = null }) {
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [type, setType] = useState('boolean')
    const [unit, setUnit] = useState('')
    const [options, setOptions] = useState([])
    const [currentOption, setCurrentOption] = useState('')
    const [allowNotes, setAllowNotes] = useState(false)
    const [isNewCat, setIsNewCat] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name)
                setCategory(initialData.category)
                setType(initialData.type)
                setUnit(initialData.unit || '')
                setOptions(initialData.options || [])
                setAllowNotes(initialData.allowNotes || false)
                setIsNewCat(false)
            } else {
                setName('')
                setCategory('')
                setType('boolean')
                setUnit('')
                setOptions([])
                setAllowNotes(false)
                setIsNewCat(false)
            }
        }
    }, [isOpen, initialData])

    if (!isOpen) return null

    const GEN_Z_IDEAS = [
        { name: 'Rotting Time', category: 'Self Care', type: 'number', unit: 'HRS' },
        { name: 'Touch Grass', category: 'Mental Health', type: 'boolean', unit: '' },
        { name: 'Girl Dinner', category: 'Nutrition', type: 'boolean', unit: '' },
        { name: 'Yap Session', category: 'Social', type: 'number', unit: 'MIN' },
        { name: 'Main Character Energy', category: 'Vibes', type: 'boolean', unit: '' },
        { name: 'Hydration Check', category: 'Bio-Metrics', type: 'number', unit: 'OZ' },
        { name: 'Doomscrolling', category: 'Bad Habits', type: 'number', unit: 'HRS' },
        { name: 'Gym Log', category: 'Fitness', type: 'text', unit: '', options: ['Legs', 'Push', 'Pull', 'Cardio'] },
        { name: 'Daily Mantra', category: 'Mindfulness', type: 'text', unit: '', allowNotes: true }
    ]

    const handleInspire = () => {
        const random = GEN_Z_IDEAS[Math.floor(Math.random() * GEN_Z_IDEAS.length)]
        setName(random.name)
        setCategory(random.category)
        setType(random.type)
        setUnit(random.unit || '')
        setOptions(random.options || [])
        setAllowNotes(random.allowNotes || false)
        setIsNewCat(true)
    }

    const handleAddOption = () => {
        if (currentOption.trim()) {
            setOptions([...options, currentOption.trim()])
            setCurrentOption('')
        }
    }

    const removeOption = (idx) => {
        setOptions(options.filter((_, i) => i !== idx))
    }

    const handleSave = () => {
        if (!name || !category) return showToast('FILL IT OUT BESTIE!', 'warning')
        onSave({
            id: initialData?.id || name.toLowerCase().replace(/\s+/g, '_'),
            name,
            category,
            type,
            unit: type === 'number' ? unit : '',
            options: type === 'text' ? options : [],
            allowNotes
        })
        onClose()
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="cyber-card" style={{ width: '400px', maxWidth: '90%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card-bg)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div className="cyber-header" style={{ marginBottom: 0, background: 'var(--purple)', color: 'white' }}>
                        {initialData ? 'EDIT TRACKABLE' : 'ADD NEW TRACKABLE'}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* INSPIRE BUTTON */}
                    <button
                        onClick={handleInspire}
                        className="sidebar-btn"
                        style={{ justifyContent: 'center', background: 'var(--yellow)', borderStyle: 'dashed', color: 'black' }}
                    >
                        <Sparkles size={16} /> INSPIRE ME ✨
                    </button>

                    {/* NAME INPUT */}
                    <div>
                        <label className="control-label">HABIT NAME</label>
                        <input
                            className="sidebar-btn"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Crochet"
                            style={{ cursor: 'text', border: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                        />
                    </div>

                    {/* CATEGORY INPUT */}
                    <div>
                        <label className="control-label">CATEGORY</label>
                        {!isNewCat ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className="sidebar-btn"
                                    value={category}
                                    style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                    onChange={(e) => {
                                        if (e.target.value === 'NEW') setIsNewCat(true)
                                        else setCategory(e.target.value)
                                    }}
                                >
                                    <option value="" style={{ background: 'var(--card-bg)' }}>SELECT...</option>
                                    {existingCategories.map(c => <option key={c} value={c} style={{ background: 'var(--card-bg)' }}>{c}</option>)}
                                    <option value="NEW" style={{ background: 'var(--card-bg)' }}>+ CREATE NEW</option>
                                </select>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    className="sidebar-btn"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="NEW CATEGORY NAME"
                                    style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: 'var(--input-border)' }}
                                    autoFocus
                                />
                                <button onClick={() => setIsNewCat(false)} className="sidebar-btn" style={{ width: 'auto', background: 'var(--card-bg)', color: 'var(--text-color)', border: 'var(--input-border)' }}><X size={16} /></button>
                            </div>
                        )}
                    </div>

                    {/* TYPE SELECTOR */}
                    <div>
                        <label className="control-label">TRACKING TYPE</label>
                        <div className="toggle-group">
                            <button
                                className={`toggle-btn ${type === 'boolean' ? 'active yes' : ''}`}
                                onClick={() => setType('boolean')}
                                style={{ backgroundColor: type === 'boolean' ? 'var(--green)' : 'var(--card-bg)', color: type === 'boolean' ? 'black' : 'var(--text-color)' }}
                            >
                                YES/NO
                            </button>
                            <button
                                className={`toggle-btn ${type === 'number' ? 'active no' : ''}`}
                                onClick={() => setType('number')}
                                style={{ backgroundColor: type === 'number' ? 'var(--blue)' : 'var(--card-bg)', color: type === 'number' ? 'white' : 'var(--text-color)' }}
                            >
                                NUMBER
                            </button>
                            <button
                                className={`toggle-btn ${type === 'text' ? 'active no' : ''}`}
                                onClick={() => setType('text')}
                                style={{ backgroundColor: type === 'text' ? 'var(--black)' : 'var(--card-bg)', color: type === 'text' ? 'var(--white)' : 'var(--text-color)' }}
                            >
                                TEXT
                            </button>
                            <button
                                className={`toggle-btn ${type === 'date' ? 'active no' : ''}`}
                                onClick={() => setType('date')}
                                style={{ backgroundColor: type === 'date' ? 'var(--pink)' : 'var(--card-bg)', color: type === 'date' ? 'var(--white)' : 'var(--text-color)' }}
                            >
                                DATE
                            </button>
                        </div>
                    </div>

                    {/* UNIT INPUT (Only for Number) */}
                    {type === 'number' && (
                        <div>
                            <label className="control-label">UNIT / SUFFIX</label>
                            <input
                                className="sidebar-btn"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="e.g. MIN, KM, PGS"
                                style={{ cursor: 'text', border: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                maxLength={5}
                            />
                        </div>
                    )}

                    {/* OPTIONS INPUT (Only for Text) */}
                    {type === 'text' && (
                        <div>
                            <label className="control-label">PRESET OPTIONS (OPTIONAL)</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    className="sidebar-btn"
                                    value={currentOption}
                                    onChange={(e) => setCurrentOption(e.target.value)}
                                    placeholder="e.g. Leg Day"
                                    style={{ cursor: 'text', border: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                />
                                <button onClick={handleAddOption} className="sidebar-btn" style={{ width: 'auto', background: 'var(--green)' }}>
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {options.map((opt, idx) => (
                                    <span key={idx} style={{
                                        background: 'var(--black)', color: 'var(--white)', padding: '4px 8px',
                                        fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid black'
                                    }}>
                                        {opt}
                                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeOption(idx)} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ALLOW DATA / NOTES */}
                    <div>
                        <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={allowNotes}
                                onChange={(e) => setAllowNotes(e.target.checked)}
                                style={{ transform: 'scale(1.5)' }}
                            />
                            ALLOW DAILY NOTES? 📝
                        </label>
                    </div>

                    {/* SAVE BUTTON */}
                    <button
                        onClick={handleSave}
                        className="sync-btn"
                        style={{ marginTop: '16px', fontSize: '1rem', padding: '16px', background: 'var(--text-color)', color: 'var(--bg-color)' }}
                    >
                        SAVE TRACKABLE
                    </button>
                </div>
            </div>
        </div>
    )
}
