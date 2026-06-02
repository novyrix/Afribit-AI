import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DevPortal from './developers/DevPortal.tsx'
import InflationApp from './inflation/InflationApp.tsx'

const isDeveloperPortal = window.location.pathname.startsWith('/developers')
const isInflationTracker = window.location.pathname.startsWith('/inflation-tracker')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isInflationTracker ? <InflationApp /> : isDeveloperPortal ? <DevPortal /> : <App />}
  </StrictMode>,
)

// Service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  })
}
