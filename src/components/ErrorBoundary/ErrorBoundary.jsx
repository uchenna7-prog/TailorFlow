import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px 20px', color: '#fff', background: '#000', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ff4d4d', marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ background: '#111', padding: 16, borderRadius: 8, fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#fb923c' }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </pre>
          <button onClick={() => window.location.href = '/customers'} style={{ marginTop: 24, background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
            Back to Clients
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
