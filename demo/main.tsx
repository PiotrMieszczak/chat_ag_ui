import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { worker } from './MockAgentServer'

// Start MSW in development
worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
