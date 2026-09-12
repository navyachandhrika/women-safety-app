import { useState } from 'react'

import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'

const API_URL = 'http://localhost:8080'

function RegisterForm({
  goToLogin,
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setMessageType('')
    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name,
            email,
            phone,
            password,
          }),
        }
      )

      if (!response.ok) {
        let errorMessage =
          'Unable to create your account.'

        try {
          const data =
            await response.json()

          if (data.message) {
            errorMessage =
              data.message
          }
        } catch {
          // Keep default message.
        }

        setMessage(errorMessage)
        setMessageType('error')

        return
      }

      setMessage(
        'Account created successfully. You can now login.'
      )

      setMessageType('success')

      setName('')
      setEmail('')
      setPhone('')
      setPassword('')

      setTimeout(() => {
        goToLogin()
      }, 1500)
    } catch (error) {
      console.error(error)

      setMessage(
        'Unable to connect to the server.'
      )

      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2>Create Account</h2>

      {message && (
        <div
          className={
            `form-alert ${messageType}`
          }
        >
          {messageType ===
          'success' ? (
            <CheckCircle2
              size={17}
            />
          ) : (
            <AlertCircle
              size={17}
            />
          )}

          <span>{message}</span>
        </div>
      )}

      <label htmlFor="register-name">
        Full Name
      </label>

      <input
        id="register-name"
        type="text"
        value={name}
        onChange={(event) =>
          setName(
            event.target.value
          )
        }
        placeholder="Enter your full name"
        required
      />

      <label htmlFor="register-email">
        Email
      </label>

      <input
        id="register-email"
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(
            event.target.value
          )
        }
        placeholder="Enter your email"
        required
      />

      <label htmlFor="register-phone">
        Phone Number
      </label>

      <input
        id="register-phone"
        type="tel"
        value={phone}
        onChange={(event) =>
          setPhone(
            event.target.value
          )
        }
        placeholder="Enter your phone number"
        required
      />

      <label htmlFor="register-password">
        Password
      </label>

      <div className="password-field">

        <input
          id="register-password"
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          placeholder="Create a password"
          required
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShowPassword(
              (current) =>
                !current
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
        <UserPlus size={17} />

        {loading
          ? 'Creating Account...'
          : 'Create Account'}
      </button>

      <p className="switch-text">
        Already have an account?{' '}

        <button
          type="button"
          className="link-button"
          onClick={goToLogin}
        >
          Login
        </button>
      </p>

    </form>
  )
}

export default RegisterForm