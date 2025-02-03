/**
 * API client exports
 */
export * from './types'
export * from './base'
export * from './daikin'
export * from './composable'

import { DaikinApi } from './daikin'

// Create default instance
const api = new DaikinApi({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
})

export default api