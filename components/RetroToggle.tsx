export function RetroToggle({ label, value, onChange }) {
    return (
        <div style={{ marginBottom: '24px' }}>
            <label className="control-label">
                {label}
            </label>

            <div className="toggle-group">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`toggle-btn yes ${value === true ? 'active' : ''}`}
                >
                    YES
                </button>
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`toggle-btn no ${value === false ? 'active' : ''}`}
                >
                    NO
                </button>
            </div>
        </div>
    )
}
