import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortalLayout from './PortalLayout'
import Landing from './pages/Landing'
import Directory from './pages/Directory'
import ConnectorDetail from './pages/ConnectorDetail'
import Spec from './pages/Spec'
import Playground from './pages/Playground'
import Status from './pages/Status'
import Submit from './pages/Submit'
import Docs from './pages/Docs'

export default function DevPortal() {
  return (
    <BrowserRouter>
      <PortalLayout>
        <Routes>
          <Route path="/developers" element={<Landing />} />
          <Route path="/developers/connectors" element={<Directory />} />
          <Route path="/developers/connectors/:id" element={<ConnectorDetail />} />
          <Route path="/developers/spec" element={<Spec />} />
          <Route path="/developers/docs" element={<Docs />} />
          <Route path="/developers/playground" element={<Playground />} />
          <Route path="/developers/status" element={<Status />} />
          <Route path="/developers/submit" element={<Submit />} />
          <Route path="*" element={<Navigate to="/developers" replace />} />
        </Routes>
      </PortalLayout>
    </BrowserRouter>
  )
}
