import Image from 'next/image'

export function Logo({ width = 200, height = 200, className = "" }) {
    return (
        <div className={`logo-container ${className}`} style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
            <Image
                src="/logo.png"
                alt="MoodSlayer Logo"
                fill
                priority
                style={{ objectFit: 'contain' }}
            />
        </div>
    )
}
