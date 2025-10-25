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
import type { RegisterData } from '@/types'

export function RegisterForm() {
    const router = useRouter()
    const { toast } = useToast()
    const { setAuth } = useAuthStore()
    const [formData, setFormData] = useState<RegisterData>({
        username: '',
        email: '',
        password: '',
    })
    const [confirmPassword, setConfirmPassword] = useState('')

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterData) => {
            const user = await authApi.register(data)
            const authResponse = await authApi.login({
                username: data.username,
                password: data.password,
            })
            // Save token immediately for subsequent requests
            localStorage.setItem('token', authResponse.access_token)
            return { authResponse, user }
        },
        onSuccess: ({ authResponse, user }) => {
            setAuth(user, authResponse.access_token)
            toast({
                title: '✓ Account created!',
                description: 'Welcome to QuickPoll',
            })
            router.push('/')
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail
            toast({
                title: 'Registration failed',
                description: typeof detail === 'string' ? detail : 'Please check your inputs',
                variant: 'destructive',
            })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please make sure both passwords are the same',
                variant: 'destructive',
            })
            return
        }

        registerMutation.mutate(formData)
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up for a new QuickPoll account</CardDescription>
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
                            placeholder="Choose a username"
                            required
                            minLength={3}
                            maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                            3-50 characters, letters, numbers, and underscores only
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="your@email.com"
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
                            placeholder="Create a strong password"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-muted-foreground">
                            Min 8 characters, 1 uppercase, 1 lowercase, 1 number
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? 'Creating account...' : 'Sign Up'}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-primary hover:underline">
                            Login
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
