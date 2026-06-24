import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const api = axios.create({ baseURL: '/api', withCredentials: false })

let refreshing: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const rt = getRefreshToken()
  if (!rt) return null
  try {
    const r = await axios.post('/api/presence/app/auth/refresh', { refreshToken: rt })
    const next = r.data?.data
    if (!next?.accessToken || !next?.refreshToken) return null
    setTokens(next.accessToken, next.refreshToken)
    return next.accessToken as string
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.request.use((cfg) => {
  const t = getAccessToken()
  if (t) cfg.headers.set('Authorization', `Bearer ${t}`)
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig | undefined
    const status = err.response?.status
    const url = original?.url || ''
    if (status === 401 && original && !original._retry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      original._retry = true
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
      const token = await refreshing
      if (token) {
        original.headers!.set('Authorization', `Bearer ${token}`)
        return api.request(original)
      }
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
