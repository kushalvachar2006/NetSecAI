import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { netSecAIService } from '../services/api'

const initialState = {
  urlAnalysis: { loading: false, result: null, error: null },
  pcapAnalysis: { loading: false, result: null, error: null, progress: 0 },
  threatIntel:  { loading: false, result: null, error: null },
  contentAnalysis: { loading: false, result: null, error: null },
  fullAnalysis: { loading: false, result: null, error: null },

}

const ACTIONS = {
  SET: 'SET',
  RESET: 'RESET',

}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET:
      return { ...state, [action.key]: { ...state[action.key], ...action.payload } }
    case ACTIONS.RESET:
      return { ...state, [action.key]: initialState[action.key] }

    default:
      return state
  }
}

const NetSecContext = createContext()

export function NetSecProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const set = (key, payload) => dispatch({ type: ACTIONS.SET, key, payload })
  const reset = (key) => dispatch({ type: ACTIONS.RESET, key })

  // URL Analysis → POST /api/url/analyze
  const analyzeUrl = useCallback(async (url) => {
    set('urlAnalysis', { loading: true, error: null, result: null })
    try {
      const result = await netSecAIService.analyzeUrl(url, true)
      set('urlAnalysis', { loading: false, result })
      return result
    } catch (err) {
      set('urlAnalysis', { loading: false, error: err.message || 'Analysis failed' })
    }
  }, [])

  const resetUrlAnalysis = useCallback(() => reset('urlAnalysis'), [])

  // PCAP Analysis → POST /api/pcap/analyze
  const analyzePcap = useCallback(async (file, explain = false) => {
    set('pcapAnalysis', { loading: true, error: null, result: null, progress: 0 })
    try {
      const result = await netSecAIService.analyzePcap(file, explain, (e) => {
        if (e.total) set('pcapAnalysis', { progress: Math.round((e.loaded / e.total) * 100) })
      })
      set('pcapAnalysis', { loading: false, result, progress: 100 })
      return result
    } catch (err) {
      set('pcapAnalysis', { loading: false, error: err.message || 'PCAP analysis failed', progress: 0 })
    }
  }, [])

  const resetPcapAnalysis = useCallback(() => reset('pcapAnalysis'), [])

  // Threat Intel → POST /api/threat/check
  const checkThreat = useCallback(async (target, explain = false) => {
    set('threatIntel', { loading: true, error: null, result: null })
    try {
      const result = await netSecAIService.checkThreat(target, explain)
      set('threatIntel', { loading: false, result })
      return result
    } catch (err) {
      set('threatIntel', { loading: false, error: err.message || 'Threat check failed' })
    }
  }, [])

  const resetThreatIntel = useCallback(() => reset('threatIntel'), [])

  // Content Analysis → POST /api/content/analyze
  const analyzeContent = useCallback(async (url) => {
    set('contentAnalysis', { loading: true, error: null, result: null })
    try {
      const result = await netSecAIService.analyzeContent(url, true)
      set('contentAnalysis', { loading: false, result })
      return result
    } catch (err) {
      set('contentAnalysis', { loading: false, error: err.message || 'Content analysis failed' })
    }
  }, [])

  const resetContentAnalysis = useCallback(() => reset('contentAnalysis'), [])

  // Full Analysis → POST /api/analyze/full
  const runFullAnalysis = useCallback(async (url, options) => {
    set('fullAnalysis', { loading: true, error: null, result: null })
    try {
      const result = await netSecAIService.analyzeFull(url, options)
      set('fullAnalysis', { loading: false, result })
      return result
    } catch (err) {
      set('fullAnalysis', { loading: false, error: err.message || 'Full analysis failed' })
    }
  }, [])

  const resetFullAnalysis = useCallback(() => reset('fullAnalysis'), [])



  return (
    <NetSecContext.Provider value={{
      state,
      analyzeUrl, resetUrlAnalysis,
      analyzePcap, resetPcapAnalysis,
      checkThreat, resetThreatIntel,
      analyzeContent, resetContentAnalysis,
      runFullAnalysis, resetFullAnalysis,

    }}>
      {children}
    </NetSecContext.Provider>
  )
}

export function useNetSec() {
  const ctx = useContext(NetSecContext)
  if (!ctx) throw new Error('useNetSec must be used within NetSecProvider')
  return ctx
}
