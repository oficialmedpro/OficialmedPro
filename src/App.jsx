import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import DashboardMetaAds from './pages/DashboardMetaAds'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/meta-ads" element={<DashboardMetaAds />} />
      </Routes>
    </Router>
  )
}

export default App
