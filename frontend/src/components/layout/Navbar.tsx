'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { PlusCircle, LogOut, User } from 'lucide-react'

export function Navbar() {
    const router = useRouter()
    const { user, clearAuth, isAuthenticated } = useAuthStore()
    const [mounted, setMounted] = useState(false)

    // Only render auth-dependent UI after mounting (client-side only)
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = () => {
        clearAuth()
        router.push('/auth/login')
    }

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
                        QuickPoll
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {!mounted ? (
                            // Show loading state during SSR/hydration
                            <div className="h-9 w-24 sm:w-32 animate-pulse bg-muted rounded" />
                        ) : isAuthenticated() ? (
                            <>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="max-w-[100px] truncate">{user?.username}</span>
                                </div>
                                <Button asChild variant="default" size="sm">
                                    <Link href="/create">
                                        <PlusCircle className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Create Poll</span>
                                    </Link>
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    size="sm"
                                >
                                    <LogOut className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/auth/login">Login</Link>
                                </Button>
                                <Button asChild variant="default" size="sm">
                                    <Link href="/auth/register">Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
