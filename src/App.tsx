import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, TrendingUp, Kanban } from 'lucide-react'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import People from './pages/People'
import PersonDetail from './pages/PersonDetail'
import Opportunities from './pages/Opportunities'
import OpportunityDetail from './pages/OpportunityDetail'
import Board from './pages/Board'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <TrendingUp size={20} />
            </div>
            <h1>MyContacts</h1>
            <span>CRM</span>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Overview</div>
            <NavLink to="/" end id="nav-home">
              <LayoutDashboard className="nav-icon" size={18} />
              Home
            </NavLink>
            <div className="sidebar-section-label">Records</div>
            <NavLink to="/accounts" id="nav-accounts">
              <Building2 className="nav-icon" size={18} />
              Accounts
            </NavLink>
            <NavLink to="/people" id="nav-people">
              <Users className="nav-icon" size={18} />
              People
            </NavLink>
            <NavLink to="/opportunities" id="nav-opportunities">
              <TrendingUp className="nav-icon" size={18} />
              Opportunities
            </NavLink>
            <div className="sidebar-section-label">Pipeline</div>
            <NavLink to="/board" id="nav-board">
              <Kanban className="nav-icon" size={18} />
              Board
            </NavLink>
          </nav>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/board" element={<Board />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
