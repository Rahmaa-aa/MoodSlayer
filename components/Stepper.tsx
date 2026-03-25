import { Minus, Plus } from 'lucide-react'

export function Stepper({ value, onChange, label, suffix = '', max = Infinity }) {
    // Ensure value is a number or empty string to allow typing
    const val = value === 0 ? 0 : (value || '')

    const handleInputChange = (e) => {
        const newVal = e.target.value
        if (newVal === '') {
            onChange('')
            return
        }
        const num = parseInt(newVal)
        if (!isNaN(num)) {
            onChange(Math.min(max, Math.max(0, num)))
        }
    }

    const increment = () => {
        const current = parseInt(val) || 0
        if (current < max) {
            onChange(current + 1)
        }
    }

    const decrement = () => {
        const current = parseInt(val) || 0
        onChange(Math.max(0, current - 1))
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            <label className="control-label">
                {label} {max !== Infinity && <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>(MAX: {max})</span>}
            </label>

            <div className="stepper-group">
                <button
                    type="button"
                    onClick={decrement}
                    className="stepper-btn"
                >
                    <Minus size={20} strokeWidth={4} />
                </button>

                <div className="stepper-display" style={{ padding: '0 8px', cursor: 'text' }} onClick={() => document.getElementById(`input-${label}`).focus()}>
                    <input
                        id={`input-${label}`}
                        type="number"
                        value={val}
                        onChange={handleInputChange}
                        className="w-full h-full text-center bg-transparent border-none outline-none font-black"
                        style={{ fontSize: '1.2rem', fontFamily: 'inherit', width: '100%' }}
                        max={max}
                        min={0}
                    />
                    <span className="stepper-suffix">{suffix}</span>
                </div>

                <button
                    type="button"
                    onClick={increment}
                    className="stepper-btn"
                >
                    <Plus size={20} strokeWidth={4} />
                </button>
            </div>
        </div>
    )
}
