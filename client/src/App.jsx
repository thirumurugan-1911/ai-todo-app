import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AllTasks from './pages/AllTasks.jsx'
import Today from './pages/Today.jsx'
import Completed from './pages/Completed.jsx'
import AIPlanner from './pages/AIPlanner.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<AllTasks />} />
          <Route path="/today" element={<Today />} />
          <Route path="/completed" element={<Completed />} />
          <Route path="/planner" element={<AIPlanner />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
