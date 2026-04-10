import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import WritePage from '@/pages/WritePage'
import DiaryPage from '@/pages/DiaryPage'
import DiaryDetail from '@/pages/DiaryDetail'
import ReviewPage from '@/pages/ReviewPage'
import InsightPage from '@/pages/InsightPage'
import DatabasePage from '@/pages/DatabasePage'
import TracePage from '@/pages/TracePage'
import StatsPage from '@/pages/StatsPage'
import SearchPage from '@/pages/SearchPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<WritePage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/diary/:date" element={<DiaryDetail />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/insight/:id" element={<InsightPage />} />
          <Route path="/database" element={<DatabasePage />} />
          <Route path="/trace/:date" element={<TracePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
