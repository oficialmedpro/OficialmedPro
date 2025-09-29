import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pages/DashboardPage.css'
import App from './App.jsx'
import scheduledSyncService from './service/scheduledSyncService.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Auto-start scheduled synchronization on app load
try {
  // Avoid double-start; service guards internally
  scheduledSyncService.start()
} catch (err) {
  // Non-blocking
  console.warn('Falha ao iniciar sincronização agendada automaticamente:', err)
}
