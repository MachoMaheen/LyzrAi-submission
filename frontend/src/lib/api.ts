import axios from 'axios'
import type { Poll, CreatePollData, LoginData, RegisterData, AuthResponse, User } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    
    const response = await api.post<AuthResponse>('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/api/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me')
    return response.data
  },
}

export const pollsApi = {
  getPolls: async (skip = 0, limit = 20): Promise<Poll[]> => {
    const response = await api.get<Poll[]>('/api/polls/', {
      params: { skip, limit },
    })
    return response.data
  },

  getPoll: async (id: number): Promise<Poll> => {
    const response = await api.get<Poll>(`/api/polls/${id}`)
    return response.data
  },

  createPoll: async (data: CreatePollData): Promise<Poll> => {
    const response = await api.post<Poll>('/api/polls/', data)
    return response.data
  },

  votePoll: async (pollId: number, optionId: number): Promise<Poll> => {
    const response = await api.post<Poll>(`/api/polls/${pollId}/vote`, {
      option_id: optionId,
    })
    return response.data
  },

  toggleLike: async (pollId: number): Promise<Poll> => {
    const response = await api.post<Poll>(`/api/polls/${pollId}/like`)
    return response.data
  },

  deletePoll: async (pollId: number): Promise<void> => {
    await api.delete(`/api/polls/${pollId}`)
  },
}

export default api
