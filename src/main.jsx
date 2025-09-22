import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* You can either render the App component you imported */}
    <App /> 
    
    {/* Or, if you just want to display "Hello", wrap it in a tag like this: */}
    {/* <h1>Hello</h1> */}
  </React.StrictMode>,
)