import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortalLayout from './PortalLayout'
import Landing from './pages/Landing'
import Directory from './pages/Directory'
import ConnectorDetail from './pages/ConnectorDetail'
import Spec from './pages/Spec'

export default function DevPortal() {
  return (
    <BrowserRouter>
      <PortalLayout>
        <Routes>
          <Route path="/developers" element={<Landing />} />
          <Route path="/developers/connectors" element={<Directory />} />
          <Route path="/developers/connectors/:id" element={<ConnectorDetail />} />
          <Route path="/developers/spec" element={<Spec />} />
          <Route path="*" element={<Navigate to="/developers" replace />} />
        </Routes>
      </PortalLayout>
    </BrowserRouter>
  )
}
