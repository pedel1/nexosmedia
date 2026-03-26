import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Video, Settings, Map, Tv, Globe, Activity } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <Map className="logo-icon" size={24} />
          <span className="logo-text">NexosMedia</span>
        </div>
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Inicio</span>
        </NavLink>
        
        <NavLink to="/canales" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Tv size={20} />
          <span>Canales</span>
        </NavLink>

        <NavLink to="/universo" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Globe size={20} />
          <span>El Universo</span>
        </NavLink>

        <NavLink to="/personajes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          <span>Personajes</span>
        </NavLink>

        <NavLink to="/escenarios" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Map size={20} />
          <span>Escenarios</span>
        </NavLink>

        <NavLink to="/proyectos" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Video size={20} />
          <span>Proyectos</span>
        </NavLink>

        <NavLink to="/metricas" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Activity size={20} />
          <span>Analítica</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
