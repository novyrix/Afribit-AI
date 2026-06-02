import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DevPortal from './developers/DevPortal.tsx'
import InflationApp from './inflation/InflationApp.tsx'
import PublicReportPage from './inflation/screens/PublicReportPage.tsx'
import AdminApp from './taka-sats/admin/AdminApp.tsx'
import VerifyPage from './taka-sats/VerifyPage.tsx'

const path = window.location.pathname
const isDeveloperPortal = path.startsWith('/developers')
const isCaptureForm = path.startsWith('/inflation-tracker/capture')
const isInflationAdmin = path.startsWith('/inflation-tracker/admin')
const isInflationTracker = path.startsWith('/inflation-tracker')
const isTakaAdmin = path.startsWith('/taka-sats/admin')
const isTakaVerify = path.startsWith('/taka-sats/verify')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTakaAdmin
      ? <AdminApp />
      : isTakaVerify
        ? <VerifyPage />
        : isCaptureForm || isInflationAdmin
          ? <InflationApp />
          : isInflationTracker
            ? <PublicReportPage />
            : isDeveloperPortal
              ? <DevPortal />
              : <App />}
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  })
}
