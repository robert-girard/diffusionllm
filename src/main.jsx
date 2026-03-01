import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// This file connects your App component to the index.html root element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)