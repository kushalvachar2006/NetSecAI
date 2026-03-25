import axios from 'axios'
import { toast } from 'react-toastify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 60000,
})

api.interceptors.request.use(
  (config) => { console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`); return config },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let message = 'An unexpected error occurred'
    if (error.response) {
      const data = error.response.data
      message = data?.detail || data?.message || `Server error (${error.response.status})`
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out — the server took too long to respond.'
    } else if (error.message === 'Network Error') {
      message = 'Cannot reach the NetSecAI backend. Is it running on port 8000?'
    }
    toast.error(message, { position: 'top-right', autoClose: 5000 })
    return Promise.reject({ message, originalError: error })
  }
)

class NetSecAIService {
  async analyzeUrl(url, explain = true) {
    const response = await api.post('/api/url/analyze', { url, explain })
    return response.data
  }

  async analyzePcap(file, explain = false, onUploadProgress) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('explain', String(explain))
    const response = await api.post('/api/pcap/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return response.data
  }

  async checkThreat(target, explain = false) {
    const response = await api.post('/api/threat/check', { target, explain })
    return response.data
  }

  async analyzeContent(url, explain = true) {
    const response = await api.post('/api/content/analyze', { url, explain })
    return response.data
  }

  async analyzeFull(url, options = {}) {
    const response = await api.post('/api/analyze/full', {
      url,
      include_threat_intel: options.includeThreat ?? true,
      include_content: options.includeContent ?? true,
      explain: options.explain ?? true,
    })
    return response.data
  }



  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  }
}

export const netSecAIService = new NetSecAIService()
export default api
