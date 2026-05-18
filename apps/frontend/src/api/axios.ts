import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// auth token is injected via useAuthAxios hook in App.tsx
// which adds a request interceptor dynamically.

export default api
