'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { pollsApi } from '@/lib/api'
import { createWebSocketManager } from '@/lib/websocket'
import { useAuthStore } from '@/store/authStore'
import { formatDate, calculatePercentage } from '@/lib/utils'
import type { Poll } from '@/types'
import { Heart, Trash2, User, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PollCardProps {
    poll: Poll
    onDelete?: (pollId: number) => void
}

export function PollCard({ poll: initialPoll, onDelete }: PollCardProps) {
    const [poll, setPoll] = useState<Poll>(initialPoll)
    const [selectedOption, setSelectedOption] = useState<number | null>(
        initialPoll.user_vote_option_id
    )
    const { user, token } = useAuthStore()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Update local state when prop changes (from refetch)
    useEffect(() => {
        setPoll(initialPoll)
        setSelectedOption(initialPoll.user_vote_option_id)
    }, [initialPoll])

    // WebSocket connection
    useEffect(() => {
        if (!token) {
            console.log('No token available for WebSocket')
            return
        }

        console.log(`Setting up WebSocket for poll ${poll.id}`)
        const wsManager = createWebSocketManager()
        wsManager.connect(poll.id, token)

        const unsubscribe = wsManager.subscribe((updatedPoll) => {
            console.log('Received WebSocket update:', updatedPoll)
            setPoll(updatedPoll)
            if (updatedPoll.user_vote_option_id) {
                setSelectedOption(updatedPoll.user_vote_option_id)
            }
        })

        return () => {
            console.log(`Cleaning up WebSocket for poll ${poll.id}`)
            unsubscribe()
            wsManager.disconnect()
        }
    }, [poll.id, token])

    const voteMutation = useMutation({
        mutationFn: (optionId: number) => pollsApi.votePoll(poll.id, optionId),
        onSuccess: (data) => {
            setPoll(data)
            setSelectedOption(data.user_vote_option_id)
            toast({
                title: '✓ Vote recorded!',
                description: 'Your vote has been counted.',
            })
            queryClient.invalidateQueries({ queryKey: ['polls'] })
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to vote',
                variant: 'destructive',
            })
        },
    })

    const likeMutation = useMutation({
        mutationFn: () => pollsApi.toggleLike(poll.id),
        onSuccess: (data) => {
            setPoll(data)
            toast({
                title: data.user_liked ? '❤️ Liked!' : 'Unliked',
                description: data.user_liked
                    ? 'Added to your favorites'
                    : 'Removed from favorites',
            })
            queryClient.invalidateQueries({ queryKey: ['polls'] })
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to like poll',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => pollsApi.deletePoll(poll.id),
        onSuccess: () => {
            toast({
                title: 'Poll deleted',
                description: 'Your poll has been removed.',
            })
            queryClient.invalidateQueries({ queryKey: ['polls'] })
            onDelete?.(poll.id)
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to delete poll',
                variant: 'destructive',
            })
        },
    })

    const handleVote = (optionId: number) => {
        if (voteMutation.isPending) return
        voteMutation.mutate(optionId)
    }

    const handleLike = () => {
        if (likeMutation.isPending) return
        likeMutation.mutate()
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this poll?')) {
            deleteMutation.mutate()
        }
    }

    const isOwner = user?.id === poll.creator_id

    return (
        <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{poll.title}</h3>
                        {poll.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-words">
                                {poll.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{poll.creator_username}</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{formatDate(poll.created_at)}</span>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                                <span>{poll.total_votes} votes</span>
                            </div>
                        </div>
                    </div>
                    {isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                <div className="space-y-2 sm:space-y-3">
                    {poll.options.map((option) => {
                        const percentage = calculatePercentage(
                            option.vote_count,
                            poll.total_votes
                        )
                        const isSelected = selectedOption === option.id
                        const showResults = poll.user_voted

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                disabled={voteMutation.isPending}
                                className={cn(
                                    'w-full relative overflow-hidden rounded-lg border-2 p-3 sm:p-4 text-left transition-all cursor-pointer',
                                    isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50',
                                    'hover:bg-accent'
                                )}
                            >
                                {showResults && (
                                    <div
                                        className="absolute inset-0 bg-primary/10 transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                )}
                                <div className="relative flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm sm:text-base break-words flex-1">{option.text}</span>
                                    {showResults && (
                                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                                                {option.vote_count} votes
                                            </span>
                                            <span className="text-base sm:text-lg font-bold text-primary">
                                                {percentage}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={cn(poll.user_liked && 'text-red-500', 'text-xs sm:text-sm')}
                >
                    <Heart
                        className={cn(
                            'h-4 w-4 sm:mr-2',
                            poll.user_liked && 'fill-current'
                        )}
                    />
                    <span className="hidden sm:inline">{poll.like_count} {poll.like_count === 1 ? 'Like' : 'Likes'}</span>
                    <span className="sm:hidden ml-1">{poll.like_count}</span>
                </Button>

                {poll.user_voted && (
                    <span className="text-xs text-muted-foreground">
                        ✓ Voted
                    </span>
                )}
            </CardFooter>
        </Card>
    )
}
