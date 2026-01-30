'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const UserContext = createContext()

export function UserProvider({ children }) {
    const { data: session, status } = useSession()
    const [userStats, setUserStats] = useState({ level: 1, xp: 0, streak: 0 })
    const [trackables, setTrackables] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        if (status === 'authenticated') {
            try {
                const res = await fetch('/api/user-stats')
                const data = await res.json()
                if (data && !data.error) {
                    setUserStats(data)
                }

                const resT = await fetch('/api/trackables')
                const savedT = await resT.json()
                if (Array.isArray(savedT)) {
                    setTrackables(savedT)
                }
            } catch (e) {
                console.error('Failed to fetch stats or trackables', e)
            } finally {
                setLoading(false)
            }
        } else if (status === 'unauthenticated') {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [status])

    const refreshStats = () => fetchStats()

    const toggleSurvivalMode = async () => {
        const newState = !userStats.survivalMode;

        // Optimistic update
        setUserStats(prev => ({
            ...prev,
            survivalMode: newState,
            volitionShield: newState // Enabling survival mode automatically activates the shield
        }));

        try {
            await fetch('/api/user-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survivalMode: newState,
                    volitionShield: newState
                })
            });
            refreshStats(); // Pull final calculated stats
        } catch (e) {
            console.error('Failed to toggle survival mode', e);
        }
    };

    // Initialize as false for both server and client to avoid hydration mismatch
    const [isMiniSidebar, setIsMiniSidebar] = useState(false)

    // Sync isMiniSidebar with localStorage after mounting
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mood_sidebar_mini')
            if (saved !== null) {
                setIsMiniSidebar(saved === 'true')
            }

            const handleStorageChanges = (e) => {
                if (e.key === 'mood_sidebar_mini') {
                    setIsMiniSidebar(e.newValue === 'true')
                }
            }
            window.addEventListener('storage', handleStorageChanges)
            return () => window.removeEventListener('storage', handleStorageChanges)
        }
    }, [])

    const toggleSidebar = () => {
        const newState = !isMiniSidebar
        setIsMiniSidebar(newState)
        localStorage.setItem('mood_sidebar_mini', newState)
    }

    return (
        <UserContext.Provider value={{
            userStats,
            setUserStats,
            trackables,
            setTrackables,
            refreshStats,
            toggleSurvivalMode,
            isMiniSidebar,
            toggleSidebar,
            loading
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext)
}
