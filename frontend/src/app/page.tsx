'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/Navbar'
import { PollCard } from '@/components/polls/PollCard'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { pollsApi } from '@/lib/api'
import { Loader2, AlertCircle } from 'lucide-react'

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, router])

    const { data: polls, isLoading, error, refetch } = useQuery({
        queryKey: ['polls'],
        queryFn: () => pollsApi.getPolls(0, 50),
        enabled: isAuthenticated(),
        refetchInterval: 5000, // Auto-refetch every 5 seconds to check for new polls
    })

    if (!isAuthenticated()) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">Live Polls</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Vote on polls and see results update in real-time
                    </p>
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center py-12 sm:py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-4 px-4">
                        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
                        <p className="text-base sm:text-lg text-muted-foreground text-center">Failed to load polls</p>
                        <Button onClick={() => refetch()}>Try Again</Button>
                    </div>
                )}

                {polls && polls.length === 0 && (
                    <div className="text-center py-12 sm:py-20 px-4">
                        <p className="text-base sm:text-lg text-muted-foreground mb-4">
                            No polls yet. Be the first to create one!
                        </p>
                        <Button onClick={() => router.push('/create')}>Create Poll</Button>
                    </div>
                )}

                {polls && polls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {polls.map((poll) => (
                            <PollCard key={poll.id} poll={poll} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
