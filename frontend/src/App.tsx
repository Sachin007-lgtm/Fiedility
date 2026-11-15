import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import ResearchWorkspace from './pages/ResearchWorkspace';
import DocumentLibrary from './pages/DocumentLibrary';
import IngestionPipeline from './pages/IngestionPipeline';
import SystemHealth from './pages/SystemHealth';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Auth from './pages/Auth';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/workspace" element={<ResearchWorkspace />} />
          <Route path="/library" element={<DocumentLibrary />} />
          <Route path="/ingestion" element={<IngestionPipeline />} />
          <Route path="/health" element={<SystemHealth />} />
          <Route path="/monitoring" element={<MonitoringDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
