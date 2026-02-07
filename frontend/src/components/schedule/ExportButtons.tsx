'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileJson, Calendar, FileText, Copy, Check, Eye } from 'lucide-react'
import { api } from '@/lib/api'

interface ExportButtonsProps {
    scheduleId: string
    hackathonName: string
}

export function ExportButtons({ scheduleId, hackathonName }: ExportButtonsProps) {
    const [showPreview, setShowPreview] = useState(false)
    const [previewContent, setPreviewContent] = useState('')
    const [copied, setCopied] = useState(false)

    const exportMutation = useMutation({
        mutationFn: ({ format }: { format: 'json' | 'ics' | 'markdown' }) =>
            api.exportSchedule(scheduleId, format),
    })

    const previewMutation = useMutation({
        mutationFn: () => api.previewExport(scheduleId, 'markdown'),
        onSuccess: (data) => {
            setPreviewContent(data.content)
            setShowPreview(true)
        },
    })

    const handleExport = async (format: 'json' | 'ics' | 'markdown') => {
        const data = await exportMutation.mutateAsync({ format })

        if (format === 'json') {
            downloadFile(JSON.stringify(data, null, 2), `${hackathonName}_schedule.json`, 'application/json')
        } else if (format === 'ics') {
            // ICS is returned as response with headers, need to handle differently
            downloadFile(data, `${hackathonName}_schedule.ics`, 'text/calendar')
        } else {
            downloadFile(data, `${hackathonName}_schedule.md`, 'text/markdown')
        }
    }

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename.replace(/\s+/g, '_')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(previewContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div>
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => handleExport('json')}
                    disabled={exportMutation.isPending}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <FileJson size={16} />
                    JSON
                </button>
                <button
                    onClick={() => handleExport('ics')}
                    disabled={exportMutation.isPending}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <Calendar size={16} />
                    Calendar (.ics)
                </button>
                <button
                    onClick={() => handleExport('markdown')}
                    disabled={exportMutation.isPending}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <FileText size={16} />
                    Markdown
                </button>
                <button
                    onClick={() => previewMutation.mutate()}
                    disabled={previewMutation.isPending}
                    className="btn-secondary flex items-center gap-2 text-sm"
                >
                    <Eye size={16} />
                    Preview
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Export Preview</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="btn-secondary text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-white/5 rounded-lg p-4">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                {previewContent}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
