import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Primero los estilos globales, para que los CSS Modules de los componentes vayan después en la cascada
import './estilos/tokens.css'
import './estilos/base.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
