import { useState } from 'react';
import AskBen from './components/AskBen';
import Evaluation from './components/Evaluation';

const tabs = ['ask', 'eval'];
const tabLabels = {
  ask: 'Ask Ben',
  eval: 'Evaluation',
};

function App() {
  const [activeTab, setActiveTab] = useState('ask');

  // Persistent state for AskBen - separate responses for each mode
  const [askBenState, setAskBenState] = useState({
    question: '',
    ragResponse: null,       // Response from RAG mode
    reasoningResponse: null, // Response from Reasoning mode
    error: null,
    showContext: false,
    mode: 'auto',  // 'auto' or 'reasoning'
  });

  // Persistent state for Evaluation
  const [evalState, setEvalState] = useState({
    examples: [],
    runs: [],
    selectedRun: null,
    runDetails: null,
    activeSection: 'runs',
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: "Georgia, 'Times New Roman', serif"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '3px solid #FF5A09',
        padding: '1.5rem 2rem',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: '700',
            color: '#1a1a1a',
            fontStyle: 'italic'
          }}>
            BT Bot
          </h1>
          <p style={{
            margin: '0.25rem 0 0 0',
            color: '#666666',
            fontSize: '0.95rem'
          }}>
            An experiment to explore the last seven years of Ben Thompson's Stratechery analysis using RAG
          </p>
          <p style={{
            margin: '0.25rem 0 0 0',
            color: '#888888',
            fontSize: '0.85rem'
          }}>
            By John Chan | <a href="https://www.linkedin.com/in/johnmchan/" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'none' }}>LinkedIn</a> • <a href="https://github.com/jchan95/bt-bot/" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'none' }}>Github</a>
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.25rem',
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 1.25rem',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #FF5A09' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab ? '#1a1a1a' : '#666666',
                fontWeight: activeTab === tab ? '600' : '400',
                fontSize: '0.95rem',
                fontFamily: "Georgia, 'Times New Roman', serif",
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {activeTab === 'ask' && (
          <AskBen
            persistedState={askBenState}
            onStateChange={setAskBenState}
          />
        )}
        {activeTab === 'eval' && (
          <Evaluation
            persistedState={evalState}
            onStateChange={setEvalState}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#666666',
        fontSize: '0.85rem',
        borderTop: '1px solid #e5e5e5',
        backgroundColor: '#ffffff',
        marginTop: '2rem'
      }}>
        A RAG system for exploring Ben Thompson's Stratechery newsletter
      </footer>
    </div>
  );
}

export default App;