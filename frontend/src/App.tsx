import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ResearchWorkspace from './pages/ResearchWorkspace';
import DocumentLibrary from './pages/DocumentLibrary';
import IngestionPipeline from './pages/IngestionPipeline';
import SystemHealth from './pages/SystemHealth';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Auth from './pages/Auth';

function GlobalChatFAB() {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (location.pathname === '/workspace' || location.pathname === '/auth' || location.pathname === '/login' || location.pathname === '/signup') return null;

  return (
    <button
      onClick={() => navigate('/workspace')}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-[22px] bg-[#050505] shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/10 flex items-center justify-center hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition-all z-[100] overflow-hidden"
      aria-label="Open Chat Workspace"
    >
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="w-full h-full object-cover scale-[1.1]" 
        onError={(e) => { e.currentTarget.src = 'https://api.iconify.design/lucide:message-circle.svg?color=%23ffffff' }} 
      />
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GlobalChatFAB />
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
  );
}

export default App;
