import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Channels from './pages/Channels';
import Characters from './pages/Characters';
import Projects from './pages/Projects';
import Universe from './pages/Universe';
import Scenarios from './pages/Scenarios';
import Metrics from './pages/Metrics';
import './mobile.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/canales" element={<Channels />} />
            <Route path="/personajes" element={<Characters />} />
            <Route path="/proyectos" element={<Projects />} />
            <Route path="/universo" element={<Universe />} />
            <Route path="/escenarios" element={<Scenarios />} />
            <Route path="/metricas" element={<Metrics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
