'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { LoginData } from '@/types'

export function LoginForm() {
    const router = useRouter()
    const { toast } = useToast()
    const { setAuth } = useAuthStore()
    const [formData, setFormData] = useState<LoginData>({
        username: '',
        password: '',
    })

    const loginMutation = useMutation({
        mutationFn: async (data: LoginData) => {
            const authResponse = await authApi.login(data)
            // Save token first so it's available for the next request
            localStorage.setItem('token', authResponse.access_token)
            const user = await authApi.getCurrentUser()
            return { authResponse, user }
        },
        onSuccess: ({ authResponse, user }) => {
            setAuth(user, authResponse.access_token)
            toast({
                title: '✓ Welcome back!',
                description: `Logged in as ${user.username}`,
            })
            router.push('/')
        },
        onError: (error: any) => {
            toast({
                title: 'Login failed',
                description: error.response?.data?.detail || 'Invalid credentials',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        loginMutation.mutate(formData)
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Login to your QuickPoll account</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                    >
                        {loginMutation.isPending ? 'Logging in...' : 'Login'}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
