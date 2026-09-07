import { Component } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Mova ekran hatası:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="app-error"><div className="app-error-orbit" /><div className="app-error-mark"><Sparkles size={24} /></div><span>MOVA</span><h1>Ritmini kaybetme.</h1><p>Bu ekran hazırlanırken küçük bir aksaklık oldu. Sayfayı yenileyerek güvenle devam edebilirsin.</p><button onClick={() => window.location.reload()}><RefreshCw size={16} /> Sayfayı yenile</button></main>
  }
}

export default AppErrorBoundary
