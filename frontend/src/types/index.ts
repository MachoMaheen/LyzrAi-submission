export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
}

export interface PollOption {
  id: number
  text: string
  order: number
  vote_count: number
}

export interface Poll {
  id: number
  title: string
  description: string | null
  creator_id: number
  creator_username: string
  is_active: boolean
  created_at: string
  options: PollOption[]
  total_votes: number
  like_count: number
  user_voted: boolean
  user_liked: boolean
  user_vote_option_id: number | null
}

export interface CreatePollData {
  title: string
  description?: string
  options: { text: string }[]
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}
