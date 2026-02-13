export default function OnboardingLayout({ children }) {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10
        }}>
            {children}
        </div>
    )
}
