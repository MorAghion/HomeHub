import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

// Detect OAuth popup before Supabase clears the hash.
// sessionStorage is per-tab, so this flag is isolated to the popup window.
if (window.location.hash.includes('access_token')) {
  sessionStorage.setItem('__homehub_oauth_popup', '1')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
