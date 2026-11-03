import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Panel } from '../styles'
class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <Panel role="alert">
        <h1>Something went wrong</h1>
        <p>This view could not be displayed. Use the navigation to continue.</p>
        <Link to="/">Back to blogs</Link>
      </Panel>
    ) : (
      this.props.children
    )
  }
}
export default ErrorBoundary
