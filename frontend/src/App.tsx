import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
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

  const handleClick = () => {
    const token = localStorage.getItem('alfa_token');
    if (token) {
      navigate('/workspace');
    } else {
      navigate('/auth');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[#090b10] dark:bg-[#090b10] shadow-[0_0_25px_rgba(61,129,227,0.4)] border border-[#3D81E3]/40 flex items-center justify-center hover:scale-105 hover:border-[#00d2ff]/60 active:scale-95 transition-all z-[100] overflow-hidden group"
      aria-label="Open Finsight Research Workspace"
      title="Open Research Workspace"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <img 
          src="/logo.png" 
          alt="Finsight" 
          className="w-full h-full object-cover scale-[1.1] group-hover:scale-115 transition-transform" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />
        <MessageSquare className="w-5 h-5 text-[#3D81E3] absolute inset-auto group-hover:scale-110 transition-transform hidden group-hover:block" />
      </div>
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
