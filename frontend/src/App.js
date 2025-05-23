import React from 'react';
import CommonUI from './content/commonui/commonui';
import './App.scss';
import './App.css';
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";
import LandingPage from './content/LandingPage';
import ConfigurationPage from './content/configuration/configuration';
import RepoPage from './content/Dashboard';
import BenchmarkPage from './content/BenchmarkLogs';
import Supportpage from './content/support';
import LoginPage from './login';
import NotFound from './components/NotFound';
import { NotificationProvider } from './content/component/NotificationManager';

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<CommonUI />}>
              <Route index path="/home" element={<LandingPage />} />
              <Route path="/performance-dashboard" element={<RepoPage />} />
              <Route path="/configuration-details" element={<ConfigurationPage />} />
              <Route path="/benchmarklogs" element={<BenchmarkPage />} />
              <Route path="/support" element={<Supportpage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
