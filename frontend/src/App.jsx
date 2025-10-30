import React, { useState, useEffect, Suspense, lazy } from 'react';
import ChatBot from './Components/ChatBot';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-2xl">
            <h2 className="text-4xl font-bold mb-4 text-red-600">Something went wrong!</h2>
            <p className="text-lg text-gray-600 mb-4">
              There was an error loading this component. Please refresh the page or try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-red-600">Error Details (Dev Mode)</summary>
                <pre className="mt-2 p-4 bg-red-50 text-red-800 text-sm overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy-loaded components
const TextMidiConverter = lazy(() => 
  import('./Components/TextMidiConverter').catch(err => {
    console.error('Failed to load TextMidiConverter:', err);
    return { default: () => <PlaceholderTool title="Text MIDI Converter - Load Error" /> };
  })
);

const MidiToTextConverter = lazy(() => 
  import('./Components/MidiToTextConverter').catch(err => {
    console.error('Failed to load MidiToTextConverter:', err);
    return { default: () => <PlaceholderTool title="MIDI to Text Converter - Load Error" /> };
  })
);

// Placeholder for missing components
const PlaceholderTool = ({ title }) => (
  <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-4xl font-bold mb-4 text-gray-800">{title}</h2>
      <p className="text-lg text-gray-600">This tool is coming soon or failed to load.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try Refresh
      </button>
    </div>
  </div>
);

// Main App component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  // Initialize page based on URL
  useEffect(() => {
    const path = decodeURIComponent(window.location.pathname.substring(1)) || 'home';
    setCurrentPage(path);
  }, []);

  // Navigation handler
  const handleNavigate = (page) => {
    setCurrentPage(page);
    const pathSegment = page === 'home' ? '' : encodeURIComponent(page);
    window.history.pushState({}, '', `/${pathSegment}`);
    
    // Update page title
    const titles = {
      'home': 'MIDI AI Studio - AI Music Generation',
      'text-midi-converter': 'Text to MIDI Converter - MIDI AI Studio',
      'midi-to-text-converter': 'MIDI to Text Converter - MIDI AI Studio'
    };
    document.title = titles[page] || 'MIDI AI Studio';
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = decodeURIComponent(window.location.pathname.substring(1)) || 'home';
      setCurrentPage(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for imported MIDI text from ChatBot (for TextMidiConverter)
  useEffect(() => {
    if (currentPage === 'text-midi-converter') {
      const importedText = localStorage.getItem('imported_midi_text');
      if (importedText) {
        console.log('Found imported MIDI text for converter');
      }
    }
  }, [currentPage]);

  // Route components mapping - removed fixed heights and overflow restrictions
  const routes = {
    home: () => <ChatBot />,
    'text-midi-converter': () => <TextMidiConverter />,
    'midi-to-text-converter': () => <MidiToTextConverter />
  };

  // Get current component
  const RenderedComponent = routes[currentPage] ? routes[currentPage] : () => (
    <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4 text-gray-800">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => handleNavigate('home')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
              <p className="text-white font-medium">Loading...</p>
              <p className="text-purple-300 text-sm mt-1">Initializing MIDI tools</p>
            </div>
          </div>
        }
      >
        <RenderedComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;

