import { useState } from 'react'
import './App.css'

import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import EmergencyContacts from './components/EmergencyContacts'
import SOSHistory from './components/SOSHistory'
import SafetyJourney from './components/SafetyJourney'

function App() {
  const [page, setPage] = useState(
    sessionStorage.getItem('token')
      ? 'dashboard'
      : 'login'
  )

  function handleLogout() {
    sessionStorage.removeItem('token')
    setPage('login')
  }

  if (page === 'dashboard') {
    return (
      <Dashboard
        onLogout={handleLogout}
        onManageContacts={() =>
          setPage('contacts')
        }
        onViewHistory={() =>
          setPage('history')
        }
        onStartJourney={() =>
          setPage('journey')
        }
      />
    )
  }

  if (page === 'contacts') {
    return (
      <EmergencyContacts
        goBack={() =>
          setPage('dashboard')
        }
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'history') {
    return (
      <SOSHistory
        goBack={() =>
          setPage('dashboard')
        }
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'journey') {
    return (
      <SafetyJourney
        goBack={() =>
          setPage('dashboard')
        }
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app">
      <div className="auth-card">
        <h1>Women Safety</h1>

        <p className="subtitle">
          Emergency Assistance System
        </p>

        {page === 'login' ? (
          <LoginForm
            goToRegister={() =>
              setPage('register')
            }
            onLogin={() =>
              setPage('dashboard')
            }
          />
        ) : (
          <RegisterForm
            goToLogin={() =>
              setPage('login')
            }
          />
        )}
      </div>
    </div>
  )
}

export default App