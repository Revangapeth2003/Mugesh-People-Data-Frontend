// src/main.tsx - If you have this setup, keep it
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>  {/* ✅ Router here */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
