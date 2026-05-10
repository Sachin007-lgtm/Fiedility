import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ResearchWorkspace from './pages/ResearchWorkspace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<ResearchWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
