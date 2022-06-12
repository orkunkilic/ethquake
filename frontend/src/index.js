import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import InsurePage from './pages/InsurePage';
import IssuePage from './pages/IssuePage';
import TransferPage from './pages/TransferPage';
import TimeSkips from './pages/TimeSkips';
import ClaimDamage from './pages/ClaimDamage';
import BuyTokensOfPool from './pages/BuyTokensOfPool';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}/>
      <Route path="/insure" element={<InsurePage />}/>
      <Route path="/issue" element={<IssuePage />}/>
      <Route path="/transfer" element={<TransferPage />}/>
      <Route path="/time_skips" element={<TimeSkips />}/>
      <Route path="/claim_damage" element={<ClaimDamage />}/>
      <Route path="/buy_tokens_of_pool" element={<BuyTokensOfPool />}/>
    </Routes>
  </BrowserRouter>
);
