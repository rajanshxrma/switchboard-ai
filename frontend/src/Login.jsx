import { useState } from 'react'
import { supabase } from './lib/supabase'

function Login() {
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else setNotice('Account created. Check your email to confirm, then sign in.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel login-panel">
      <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
      <p className="login-subtitle">
        Access the live call dashboard and analytics.
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
      {notice && <p className="login-notice">{notice}</p>}

      <button
        className="login-switch"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null) }}
      >
        {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
      </button>
    </div>
  )
}

export default Login
