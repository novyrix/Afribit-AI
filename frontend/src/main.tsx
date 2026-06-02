import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DevPortal from './developers/DevPortal.tsx'

const isDeveloperPortal = window.location.pathname.startsWith('/developers')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDeveloperPortal ? <DevPortal /> : <App />}
  </StrictMode>,
)

// Service worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  })
}
