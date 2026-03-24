import { Routes, Route, Navigate } from 'react-router-dom'
import Intro from './pages/Intro'
import ServiceLayout from './components/layout/ServiceLayout'
import UrlAnalyzer from './pages/UrlAnalyzer'
import PcapAnalyzer from './pages/PcapAnalyzer'
import ThreatIntel from './pages/ThreatIntel'
import ContentAnalyzer from './pages/ContentAnalyzer'
import PacketSniffer from './pages/PacketSniffer'
import FullAnalysis from './pages/FullAnalysis'
import { NetSecProvider } from './contexts/NetSecContext'

export default function App() {
  return (
    <NetSecProvider>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/url-analyzer"     element={<ServiceLayout />}><Route index element={<UrlAnalyzer />} /></Route>
        <Route path="/pcap-analyzer"    element={<ServiceLayout />}><Route index element={<PcapAnalyzer />} /></Route>
        <Route path="/threat-intel"     element={<ServiceLayout />}><Route index element={<ThreatIntel />} /></Route>
        <Route path="/content-analyzer" element={<ServiceLayout />}><Route index element={<ContentAnalyzer />} /></Route>
        <Route path="/packet-sniffer"   element={<ServiceLayout />}><Route index element={<PacketSniffer />} /></Route>
        <Route path="/full-analysis"    element={<ServiceLayout />}><Route index element={<FullAnalysis />} /></Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NetSecProvider>
  )
}
