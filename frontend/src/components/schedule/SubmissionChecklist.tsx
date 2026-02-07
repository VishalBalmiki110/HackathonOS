'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square, Plus, Trash2, FileCode, FileText, Video, Link2 } from 'lucide-react'
import { api } from '@/lib/api'

interface ChecklistPageProps {
    scheduleId: string
}

export function SubmissionChecklist({ scheduleId }: ChecklistPageProps) {
    const queryClient = useQueryClient()
    const [showAddItem, setShowAddItem] = useState(false)
    const [newItemTitle, setNewItemTitle] = useState('')

    const { data: checklist, isLoading } = useQuery({
        queryKey: ['checklist', scheduleId],
        queryFn: () => api.getChecklist(scheduleId),
    })

    const toggleItemMutation = useMutation({
        mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
            api.updateChecklistItem(itemId, { is_completed: completed }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist', scheduleId] }),
    })

    const addItemMutation = useMutation({
        mutationFn: (title: string) =>
            api.addChecklistItem(checklist.id, { title, is_required: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist', scheduleId] })
            setNewItemTitle('')
            setShowAddItem(false)
        },
    })

    const deleteItemMutation = useMutation({
        mutationFn: api.deleteChecklistItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist', scheduleId] }),
    })

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'code': return <FileCode size={16} className="text-blue-400" />
            case 'documentation': return <FileText size={16} className="text-green-400" />
            case 'demo': return <Video size={16} className="text-purple-400" />
            default: return <Link2 size={16} className="text-gray-400" />
        }
    }

    if (isLoading) {
        return (
            <div className="card animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 bg-white/10 rounded" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CheckSquare className="text-primary-400" size={20} />
                        Submission Checklist
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        {checklist?.completed_items}/{checklist?.total_items} completed
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary-400">
                        {checklist?.progress_percent}%
                    </div>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                            style={{ width: `${checklist?.progress_percent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Progress bar for required items */}
            <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-sm text-yellow-400">
                    Required: {checklist?.required_completed}/{checklist?.required_total} completed
                </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {checklist?.items?.map((item: any) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${item.is_completed ? 'bg-green-500/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <button
                            onClick={() => toggleItemMutation.mutate({
                                itemId: item.id,
                                completed: !item.is_completed,
                            })}
                            className="flex-shrink-0"
                        >
                            {item.is_completed ? (
                                <CheckSquare className="text-green-400" size={20} />
                            ) : (
                                <Square className="text-gray-400" size={20} />
                            )}
                        </button>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                {getCategoryIcon(item.category)}
                                <span className={item.is_completed ? 'line-through text-gray-500' : ''}>
                                    {item.title}
                                </span>
                                {item.is_required && (
                                    <span className="text-xs text-red-400">*</span>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            )}
                        </div>

                        {!item.is_required && (
                            <button
                                onClick={() => deleteItemMutation.mutate(item.id)}
                                className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} className="text-red-400" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Item */}
            {showAddItem ? (
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="New checklist item..."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                        autoFocus
                    />
                    <button
                        onClick={() => addItemMutation.mutate(newItemTitle)}
                        disabled={!newItemTitle.trim()}
                        className="btn-primary"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => {
                            setShowAddItem(false)
                            setNewItemTitle('')
                        }}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <Plus size={16} />
                    Add custom item
                </button>
            )}
        </div>
    )
}
