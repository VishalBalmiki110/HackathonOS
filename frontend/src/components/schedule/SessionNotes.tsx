'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StickyNote, Plus, Save, Trash2, Link2, ExternalLink, FileCode, Video, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface SessionNotesProps {
    sessionId: string
}

export function SessionNotes({ sessionId }: SessionNotesProps) {
    const queryClient = useQueryClient()
    const [newNote, setNewNote] = useState('')
    const [showAddResource, setShowAddResource] = useState(false)
    const [newResource, setNewResource] = useState({ title: '', url: '', resource_type: 'link' })

    // Fetch notes
    const { data: notes, isLoading: notesLoading } = useQuery({
        queryKey: ['session-notes', sessionId],
        queryFn: () => api.getSessionNotes(sessionId),
    })

    // Fetch resources
    const { data: resources, isLoading: resourcesLoading } = useQuery({
        queryKey: ['session-resources', sessionId],
        queryFn: () => api.getSessionResources(sessionId),
    })

    // Mutations
    const createNoteMutation = useMutation({
        mutationFn: (content: string) => api.createNote(sessionId, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session-notes', sessionId] })
            setNewNote('')
        },
    })

    const deleteNoteMutation = useMutation({
        mutationFn: api.deleteNote,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session-notes', sessionId] }),
    })

    const createResourceMutation = useMutation({
        mutationFn: (resource: typeof newResource) => api.createResource(sessionId, resource),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session-resources', sessionId] })
            setNewResource({ title: '', url: '', resource_type: 'link' })
            setShowAddResource(false)
        },
    })

    const deleteResourceMutation = useMutation({
        mutationFn: api.deleteResource,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session-resources', sessionId] }),
    })

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'code': return <FileCode size={14} className="text-blue-400" />
            case 'video': return <Video size={14} className="text-purple-400" />
            case 'document': return <FileText size={14} className="text-green-400" />
            default: return <Link2 size={14} className="text-gray-400" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Notes Section */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <StickyNote className="text-yellow-400" size={20} />
                    <h3 className="font-semibold">Session Notes</h3>
                </div>

                {/* Add Note */}
                <div className="mb-4">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
                        rows={3}
                    />
                    {newNote.trim() && (
                        <button
                            onClick={() => createNoteMutation.mutate(newNote)}
                            disabled={createNoteMutation.isPending}
                            className="mt-2 btn-primary text-sm"
                        >
                            <Save size={14} />
                            Save Note
                        </button>
                    )}
                </div>

                {/* Notes List */}
                {notesLoading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-16 bg-white/10 rounded" />
                        <div className="h-16 bg-white/10 rounded" />
                    </div>
                ) : notes?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notes yet. Add your first note above.</p>
                ) : (
                    <div className="space-y-3">
                        {notes?.map((note: any) => (
                            <div key={note.id} className="p-3 bg-white/5 rounded-lg group">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <button
                                        onClick={() => deleteNoteMutation.mutate(note.id)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-opacity"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resources Section */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link2 className="text-blue-400" size={20} />
                        <h3 className="font-semibold">Resources</h3>
                    </div>
                    <button
                        onClick={() => setShowAddResource(!showAddResource)}
                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>

                {/* Add Resource Form */}
                {showAddResource && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg space-y-3">
                        <input
                            type="text"
                            value={newResource.title}
                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                            placeholder="Resource title"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                        />
                        <input
                            type="url"
                            value={newResource.url}
                            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                            placeholder="URL (optional)"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                        />
                        <select
                            value={newResource.resource_type}
                            onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                        >
                            <option value="link">Link</option>
                            <option value="code">Code</option>
                            <option value="document">Document</option>
                            <option value="video">Video</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => createResourceMutation.mutate(newResource)}
                                disabled={!newResource.title.trim() || createResourceMutation.isPending}
                                className="btn-primary text-sm"
                            >
                                Add Resource
                            </button>
                            <button
                                onClick={() => setShowAddResource(false)}
                                className="btn-secondary text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Resources List */}
                {resourcesLoading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-10 bg-white/10 rounded" />
                    </div>
                ) : resources?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No resources added yet.</p>
                ) : (
                    <div className="space-y-2">
                        {resources?.map((resource: any) => (
                            <div key={resource.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg group">
                                {getResourceIcon(resource.resource_type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{resource.title}</p>
                                </div>
                                {resource.url && (
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-white/10 rounded"
                                    >
                                        <ExternalLink size={14} className="text-primary-400" />
                                    </a>
                                )}
                                <button
                                    onClick={() => deleteResourceMutation.mutate(resource.id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-opacity"
                                >
                                    <Trash2 size={14} className="text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
