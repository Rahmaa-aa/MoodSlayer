'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const UserContext = createContext()

export function UserProvider({ children }) {
    const { data: session, status } = useSession()
    const [userStats, setUserStats] = useState({ level: 1, xp: 0, streak: 0 })
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        if (status === 'authenticated') {
            try {
                const res = await fetch('/api/user-stats')
                const data = await res.json()
                if (data && !data.error) {
                    setUserStats(data)
                }
            } catch (e) {
                console.error('Failed to fetch stats', e)
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

    return (
        <UserContext.Provider value={{ userStats, setUserStats, refreshStats, loading }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}
