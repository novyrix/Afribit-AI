import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DevPortal from './developers/DevPortal.tsx'
import InflationApp from './inflation/InflationApp.tsx'
import PublicReportPage from './inflation/screens/PublicReportPage.tsx'

const path = window.location.pathname
const isDeveloperPortal = path.startsWith('/developers')
const isInflationTracker = path.startsWith('/inflation-tracker')
const isPublicReport = path.startsWith('/inflation-tracker/reports')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPublicReport
      ? <PublicReportPage />
      : isInflationTracker
        ? <InflationApp />
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

// Service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  })
}
