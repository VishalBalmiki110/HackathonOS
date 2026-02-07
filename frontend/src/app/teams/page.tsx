'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Copy, Check, LogIn, UserPlus, Crown, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'

export default function TeamsPage() {
    const queryClient = useQueryClient()
    const { token, user } = useAuthStore()
    const isLoggedIn = !!token && !!user
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const { data: teams, isLoading } = useQuery({
        queryKey: ['teams'],
        queryFn: api.getTeams,
        enabled: isLoggedIn,
    })

    const createMutation = useMutation({
        mutationFn: api.createTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] })
            setShowCreateModal(false)
        },
    })

    const joinMutation = useMutation({
        mutationFn: ({ code, spec }: { code: string; spec?: string }) =>
            api.joinTeam(code, spec),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] })
            setShowJoinModal(false)
        },
    })

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown size={14} className="text-yellow-400" />
            case 'admin': return <Shield size={14} className="text-blue-400" />
            default: return null
        }
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                            <Users className="text-accent-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">
                                <span className="gradient-text">Teams</span>
                            </h1>
                            <p className="text-gray-400">
                                Collaborate with others on hackathons
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <LogIn size={18} />
                            Join Team
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Team
                        </button>
                    </div>
                </div>

                {/* Teams Grid */}
                {!isLoggedIn ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                            <LogIn className="text-accent-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Sign in to manage teams</h3>
                        <p className="text-gray-400 mb-6">
                            Create or join teams to collaborate on hackathons
                        </p>
                        <a
                            href="/auth/login"
                            className="btn-primary inline-flex items-center gap-2"
                            onClick={async (e) => {
                                e.preventDefault()
                                const data = await api.getGoogleAuthUrl()
                                window.location.href = data.auth_url
                            }}
                        >
                            <LogIn size={18} />
                            Sign in with Google
                        </a>
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                            </div>
                        ))}
                    </div>
                ) : teams?.length === 0 ? (
                    <div className="card text-center py-16">
                        <Users className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
                        <p className="text-gray-400 mb-6">
                            Create a team or join one with an invite code
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="btn-secondary"
                            >
                                Join Team
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary"
                            >
                                Create Team
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams?.map((team: any) => (
                            <div key={team.id} className="card hover:scale-[1.02] transition-transform">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold">{team.name}</h3>
                                        {team.description && (
                                            <p className="text-gray-400 text-sm mt-1">{team.description}</p>
                                        )}
                                    </div>
                                    <span className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Invite Code */}
                                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-4">
                                    <span className="text-gray-400 text-sm">Invite Code:</span>
                                    <code className="font-mono text-primary-400 flex-1">{team.invite_code}</code>
                                    <button
                                        onClick={() => copyInviteCode(team.invite_code)}
                                        className="p-1 hover:bg-white/10 rounded"
                                        title="Copy invite code"
                                    >
                                        {copiedCode === team.invite_code ? (
                                            <Check size={16} className="text-green-400" />
                                        ) : (
                                            <Copy size={16} />
                                        )}
                                    </button>
                                </div>

                                <a
                                    href={`/teams/${team.id}`}
                                    className="block text-center text-sm text-primary-400 hover:text-primary-300"
                                >
                                    View Team →
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4">Create Team</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            createMutation.mutate({
                                name: formData.get('name') as string,
                                description: formData.get('description') as string || undefined,
                            })
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Team Name *</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                                        placeholder="My Awesome Team"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                                        rows={3}
                                        placeholder="What's your team working on?"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4">Join Team</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            joinMutation.mutate({
                                code: formData.get('code') as string,
                                spec: formData.get('specialization') as string || undefined,
                            })
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Invite Code *</label>
                                    <input
                                        name="code"
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 font-mono uppercase"
                                        placeholder="ABCD1234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Your Role/Specialization</label>
                                    <select
                                        name="specialization"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                                    >
                                        <option value="">Select a role</option>
                                        <option value="frontend">Frontend</option>
                                        <option value="backend">Backend</option>
                                        <option value="fullstack">Full Stack</option>
                                        <option value="design">Design</option>
                                        <option value="ml">ML/AI</option>
                                        <option value="devops">DevOps</option>
                                        <option value="pm">Project Manager</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={joinMutation.isPending}
                                    className="btn-primary"
                                >
                                    {joinMutation.isPending ? 'Joining...' : 'Join Team'}
                                </button>
                            </div>
                            {joinMutation.isError && (
                                <p className="text-red-400 text-sm mt-4">
                                    Invalid invite code. Please check and try again.
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
