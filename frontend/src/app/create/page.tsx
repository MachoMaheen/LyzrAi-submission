'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { CreatePollForm } from '@/components/polls/CreatePollForm'
import { useAuthStore } from '@/store/authStore'

export default function CreatePollPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated()) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <CreatePollForm />
            </main>
        </div>
    )
}
