'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { pollsApi } from '@/lib/api'
import { X, Plus } from 'lucide-react'
import type { CreatePollData } from '@/types'

export function CreatePollForm() {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [errors, setErrors] = useState<Record<string, string>>({})

    const createMutation = useMutation({
        mutationFn: (data: CreatePollData) => pollsApi.createPoll(data),
        onSuccess: () => {
            // Invalidate polls cache to refetch
            queryClient.invalidateQueries({ queryKey: ['polls'] })
            toast({
                title: '✓ Poll created!',
                description: 'Your poll is now live.',
            })
            router.push('/')
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail
            toast({
                title: 'Error creating poll',
                description: typeof detail === 'string' ? detail : 'Please check your inputs',
                variant: 'destructive',
            })
        },
    })

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, ''])
        }
    }

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        }
    }

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (title.trim().length < 5) {
            newErrors.title = 'Title must be at least 5 characters'
        }

        const filledOptions = options.filter((opt) => opt.trim().length > 0)
        if (filledOptions.length < 2) {
            newErrors.options = 'You need at least 2 options'
        }

        options.forEach((opt, idx) => {
            if (opt.trim().length > 0 && opt.trim().length > 255) {
                newErrors[`option_${idx}`] = 'Option too long (max 255 characters)'
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        const pollData: CreatePollData = {
            title: title.trim(),
            description: description.trim() || undefined,
            options: options
                .filter((opt) => opt.trim().length > 0)
                .map((text) => ({ text: text.trim() })),
        }

        createMutation.mutate(pollData)
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create a New Poll</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Poll Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your question?"
                            maxLength={255}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more context..."
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>
                            Options <span className="text-destructive">*</span>
                        </Label>
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    maxLength={255}
                                />
                                {options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {errors.options && (
                            <p className="text-sm text-destructive">{errors.options}</p>
                        )}
                        {options.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addOption}
                                className="w-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Poll'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/')}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
