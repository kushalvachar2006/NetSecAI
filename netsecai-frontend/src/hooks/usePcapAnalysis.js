// Thin wrapper — delegates to NetSecContext so state is shared app-wide
import { useNetSec } from '../contexts/NetSecContext'

export function usePcapAnalysis() {
  const { state, analyzePcap, resetPcapAnalysis } = useNetSec()
  const { loading, result, error, progress } = state.pcapAnalysis

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return {
    loading,
    result,
    error,
    uploadProgress: progress,
    analyzePcap,
    reset: resetPcapAnalysis,
    formatFileSize,
    hasResult: !!result,
    hasError: !!error,
  }
}
