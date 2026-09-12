import { useState } from 'react'

import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

const API_URL = 'http://localhost:8080'

function LoginForm({
  goToRegister,
  onLogin,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      if (!response.ok) {
        setError('Invalid email or password.')
        return
      }

      const data = await response.json()

      sessionStorage.setItem(
        'token',
        data.token
      )

      onLogin()
    } catch (error) {
      console.error(error)

      setError(
        'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2>Login</h2>

      {error && (
        <div className="form-alert error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      <label htmlFor="login-email">
        Email
      </label>

      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        placeholder="Enter your email"
        required
      />

      <label htmlFor="login-password">
        Password
      </label>

      <div className="password-field">

        <input
          id="login-password"
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Enter your password"
          required
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShowPassword(
              (current) => !current
            )
          }
          aria-label={
            showPassword
              ? 'Hide password'
              : 'Show password'
          }
        >
          {showPassword ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>

      </div>

      <button
        type="submit"
        disabled={loading}
      >
        <LogIn size={17} />

        {loading
          ? 'Logging in...'
          : 'Login'}
      </button>

      <p className="switch-text">
        Don't have an account?{' '}

        <button
          type="button"
          className="link-button"
          onClick={goToRegister}
        >
          Register
        </button>
      </p>

    </form>
  )
}

export default LoginForm