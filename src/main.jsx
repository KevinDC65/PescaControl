import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { ShellProvider } from './context/ShellProvider.jsx'
import { ToastProvider } from './context/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <ShellProvider>
            <App />
          </ShellProvider>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
