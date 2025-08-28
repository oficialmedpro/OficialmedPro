import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import MetaAdsDashboard from './pages/MetaAdsDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/meta-ads" element={<MetaAdsDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
