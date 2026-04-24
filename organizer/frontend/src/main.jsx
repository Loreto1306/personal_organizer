import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ToastProvider, useToast } from './components/ToastProvider'
import { registerToastHandler } from './lib/api'

// Componente auxiliar para conectar o ToastProvider ao sistema de API (que não é um componente React)
function ApiToastConnector() {
  const { addToast } = useToast();
  React.useEffect(() => {
    registerToastHandler(addToast);
  }, [addToast]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <ApiToastConnector />
      <App />
    </ToastProvider>
  </React.StrictMode>,
)
