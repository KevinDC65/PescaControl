import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext.tsx'
import { ShellProvider } from './context/ShellProvider.tsx'
import { ToastProvider } from './context/ToastProvider.tsx'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No se encontró el elemento #root en index.html.')

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <ShellProvider>
            <App />
          </ShellProvider>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
