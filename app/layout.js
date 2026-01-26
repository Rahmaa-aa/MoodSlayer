import './globals.css'

export const metadata = {
    title: 'MoodSlayer 9000 | Track Your Vibe',
    description: 'Track your mood, period, and life patterns with a 90s twist.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <div className="grid-bg" />
                <div className="memphis-shape shape-1 float" />
                <div className="memphis-shape shape-2 float" style={{ animationDelay: '1s' }} />
                <div className="memphis-shape shape-3 float" style={{ animationDelay: '2s' }} />
                {children}
            </body>
        </html>
    )
}
