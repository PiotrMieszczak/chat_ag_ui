import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { worker } from './MockAgentServer'

// Start MSW in development
const base = import.meta.env.BASE_URL ?? '/'

worker.start({
  onUnhandledRequest: 'bypass',
  serviceWorker: { url: `${base}mockServiceWorker.js` },
}).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
