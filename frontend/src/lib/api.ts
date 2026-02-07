import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

export const api = {
    // Auth
    getGoogleAuthUrl: async () => {
        const { data } = await client.get('/auth/google/url')
        return data
    },

    googleAuth: async (code: string, redirectUri?: string) => {
        const { data } = await client.post('/auth/google', { code, redirect_uri: redirectUri })
        return data
    },

    getMe: async () => {
        const { data } = await client.get('/auth/me')
        return data
    },

    // Profile
    uploadAvatar: async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await client.post('/api/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return data
    },

    // Hackathons
    getHackathons: async (params?: { search?: string; platform?: string; mode?: string; page?: number }) => {
        const { data } = await client.get('/api/hackathons', { params })
        return data
    },

    getHackathon: async (id: string) => {
        const { data } = await client.get(`/api/hackathons/${id}`)
        return data
    },

    // Schedules
    getSchedules: async () => {
        const { data } = await client.get('/api/schedules')
        return data
    },

    getSchedule: async (id: string) => {
        const { data } = await client.get(`/api/schedules/${id}`)
        return data
    },

    createSchedule: async (hackathonId: string, startFrom?: string) => {
        const { data } = await client.post('/api/schedules', {
            hackathon_id: hackathonId,
            start_from: startFrom,
        })
        return data
    },

    activateSchedule: async (id: string) => {
        const { data } = await client.patch(`/api/schedules/${id}/activate`)
        return data
    },

    deleteSchedule: async (id: string) => {
        const { data } = await client.delete(`/api/schedules/${id}`)
        return data
    },

    // Calendar
    syncToCalendar: async (scheduleId: string) => {
        const { data } = await client.post(`/api/calendar/sync/${scheduleId}`)
        return data
    },

    exportIcs: async (scheduleId: string) => {
        const response = await client.get(`/api/calendar/export/${scheduleId}`, {
            responseType: 'blob',
        })
        return response.data
    },

    // User
    updateProfile: async (data: { name?: string; timezone?: string; work_hours_per_day?: number }) => {
        const { data: response } = await client.patch('/api/users/me', data)
        return response
    },

    getAvailability: async () => {
        const { data } = await client.get('/api/users/me/availability')
        return data
    },

    setAvailability: async (availability: Array<{ day_of_week: number; start_time: string; end_time: string }>) => {
        const { data } = await client.put('/api/users/me/availability', availability)
        return data
    },

    // Bookmarks
    getBookmarks: async () => {
        const { data } = await client.get('/api/bookmarks/hackathons')
        return data
    },

    bookmarkHackathon: async (hackathonId: string) => {
        const { data } = await client.post(`/api/bookmarks/${hackathonId}`)
        return data
    },

    unbookmarkHackathon: async (hackathonId: string) => {
        const { data } = await client.delete(`/api/bookmarks/${hackathonId}`)
        return data
    },

    checkBookmark: async (hackathonId: string) => {
        const { data } = await client.get(`/api/bookmarks/check/${hackathonId}`)
        return data
    },

    // Teams
    getTeams: async () => {
        const { data } = await client.get('/api/teams')
        return data
    },

    getTeam: async (teamId: string) => {
        const { data } = await client.get(`/api/teams/${teamId}`)
        return data
    },

    createTeam: async (teamData: { name: string; description?: string; hackathon_id?: string }) => {
        const { data } = await client.post('/api/teams', teamData)
        return data
    },

    joinTeam: async (inviteCode: string, specialization?: string) => {
        const { data } = await client.post(`/api/teams/join/${inviteCode}`, null, {
            params: { specialization }
        })
        return data
    },

    leaveTeam: async (teamId: string) => {
        const { data } = await client.delete(`/api/teams/${teamId}/leave`)
        return data
    },
}
