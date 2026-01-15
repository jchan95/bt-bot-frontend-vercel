import { useState } from 'react';
import { query } from '../services/api';

function AskBen({ persistedState, onStateChange }) {
  // Use persisted state from parent, with local loading state
  const [question, setQuestion] = useState(persistedState?.question || '');
  const [response, setResponse] = useState(persistedState?.response || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(persistedState?.error || null);
  const [showContext, setShowContext] = useState(persistedState?.showContext || false);
  const [mode, setMode] = useState(persistedState?.mode || 'auto'); // 'auto' or 'reasoning'

  // Sync state changes to parent for persistence
  const updateState = (updates) => {
    onStateChange?.((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setShowContext(false);
    updateState({ error: null, response: null, showContext: false });

    try {
      const result = await query(question, { mode });
      setResponse(result);
      updateState({ question, response: result, error: null, mode });
    } catch (err) {
      setError(err.message);
      updateState({ question, error: err.message, response: null });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
    const newQuestion = e.target.value;
    setQuestion(newQuestion);
    updateState({ question: newQuestion });
  };

  const handleToggleContext = () => {
    const newShowContext = !showContext;
    setShowContext(newShowContext);
    updateState({ showContext: newShowContext });
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    updateState({ mode: newMode });
  };

  const getTierExplanation = (tier) => {
    switch (tier) {
      case 'distillations':
        return 'Used Tier 1 (Analytical Summaries) — AI-extracted thesis statements and key claims';
      case 'chunks':
        return 'Used Tier 2 (Full Text Chunks) — Direct excerpts from articles';
      case 'hybrid':
        return 'Used Both Tiers — Analytical summaries + full text excerpts';
      case 'reasoning-first':
        return 'Reasoning First — LLM analyzed using Ben\'s frameworks, then found supporting citations';
      case 'none':
        return 'No relevant content found in either tier';
      case 'refused':
        return 'Request declined — copyright protection';
      default:
        return tier;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'distillations': return '#0066cc';
      case 'chunks': return '#FF5A09';
      case 'hybrid': return '#7c3aed';
      case 'reasoning-first': return '#059669';
      default: return '#666666';
    }
  };

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Query Form */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e5e5',
        padding: '2rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          margin: '0 0 0.5rem 0', 
          color: '#1a1a1a',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          Ask a Question
        </h2>
        <p style={{ color: '#666666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Query 10+ years of Ben Thompson's analysis using two-tier RAG retrieval.
        </p>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <button
            type="button"
            onClick={() => handleModeChange('auto')}
            style={{
              flex: 1,
              padding: '1rem',
              border: mode === 'auto' ? '2px solid #0066cc' : '1px solid #e5e5e5',
              backgroundColor: mode === 'auto' ? '#f0f7ff' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            <div style={{
              fontWeight: '600',
              color: mode === 'auto' ? '#0066cc' : '#1a1a1a',
              marginBottom: '0.5rem'
            }}>
              RAG Mode (Traditional)
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666666', lineHeight: '1.4' }}>
              Retrieves relevant content first, then generates answer based on retrieved context.
              Best for: factual questions, specific quotes, historical lookups.
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('reasoning')}
            style={{
              flex: 1,
              padding: '1rem',
              border: mode === 'reasoning' ? '2px solid #059669' : '1px solid #e5e5e5',
              backgroundColor: mode === 'reasoning' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            <div style={{
              fontWeight: '600',
              color: mode === 'reasoning' ? '#059669' : '#1a1a1a',
              marginBottom: '0.5rem'
            }}>
              Reasoning Mode (Experimental)
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666666', lineHeight: '1.4' }}>
              LLM reasons using Ben's frameworks first, then retrieves supporting citations.
              Best for: analytical questions, applying frameworks to new topics.
            </div>
          </button>
        </div>

        {/* Architecture Explainer */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e5e5e5',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
          <strong>{mode === 'reasoning' ? 'Reasoning Mode Pipeline:' : 'RAG Mode Pipeline:'}</strong>
          {mode === 'reasoning' ? (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#059669', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>1</span>
                <span>LLM analyzes using Ben's frameworks (Aggregation Theory, Incentives, etc.)</span>
                <span style={{ color: '#666' }}>→</span>
                <span style={{ backgroundColor: '#059669', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>2</span>
                <span>RAG finds supporting evidence</span>
                <span style={{ color: '#666' }}>→</span>
                <span style={{ backgroundColor: '#059669', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>3</span>
                <span>Add citations where analysis aligns</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#0066cc', fontWeight: '600' }}>Tier 1:</span> Distillations — AI-extracted summaries with thesis, key claims, topics
              </div>
              <div>
                <span style={{ color: '#FF5A09', fontWeight: '600' }}>Tier 2:</span> Chunks — Full text excerpts for precision queries
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={handleQuestionChange}
            placeholder="e.g., What is Ben's view on Apple's services strategy?"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: "Georgia, 'Times New Roman', serif",
              border: '1px solid #e5e5e5',
              minHeight: '120px',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: '1.6'
            }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#cccccc' : '#FF5A09',
              color: '#ffffff',
              border: 'none',
              fontSize: '1rem',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? (mode === 'reasoning' ? 'Analyzing & Finding Citations...' : 'Retrieving & Generating...') : 'Ask'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: '#fff5f5',
          border: '1px solid #ffcccc',
          padding: '1rem',
          color: '#cc0000',
          marginBottom: '1.5rem'
        }}>
          Error: {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
        }}>
          {/* Retrieval Tier Badge */}
          <div style={{
            padding: '1rem 2rem',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e5e5e5',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              backgroundColor: getTierColor(response.retrieval_tier),
              color: 'white',
              padding: '0.25rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {response.retrieval_tier}
            </span>
            <span style={{ color: '#666666', fontSize: '0.9rem' }}>
              {getTierExplanation(response.retrieval_tier)}
            </span>
          </div>

          {/* Answer */}
          <div style={{ padding: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#1a1a1a',
              fontSize: '1.25rem',
              fontWeight: '600',
            }}>
              Response
            </h3>
            
            <div style={{
              lineHeight: '1.8',
              color: '#1a1a1a',
              whiteSpace: 'pre-wrap',
              marginBottom: '2rem'
            }}>
              {response.answer}
            </div>

            {/* Sources with Context */}
            {response.sources && response.sources.length > 0 && (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e5e5'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: '#1a1a1a',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Retrieved Context ({response.sources.length} sources)
                  </h4>
                  <button
                    onClick={handleToggleContext}
                    style={{
                      background: 'none',
                      border: '1px solid #e5e5e5',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      color: '#0066cc'
                    }}
                  >
                    {showContext ? 'Hide RAG Context' : 'Show RAG Context'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {response.sources.map((source, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1.25rem',
                        borderLeft: `4px solid ${source.type === 'distillation' ? '#0066cc' : '#FF5A09'}`,
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      {/* Source Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#1a1a1a', 
                            marginBottom: '0.25rem' 
                          }}>
                            {source.title || 'Unknown'}
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#666666',
                          }}>
                            {source.date} • {source.type === 'distillation' ? 'Tier 1 (Distillation)' : 'Tier 2 (Chunk)'}
                          </div>
                        </div>
                        <span style={{ 
                          color: '#FF5A09', 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {(source.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>

                      {/* Topics */}
                      {source.topics && source.topics.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          {source.topics.slice(0, 5).map((topic, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: '#e5e5e5',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#1a1a1a'
                              }}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Context */}
                      {showContext && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #e5e5e5'
                        }}>
                          {source.type === 'distillation' && source.thesis_statement && (
                            <div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#666666',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.5rem'
                              }}>
                                Thesis Statement (sent to LLM)
                              </div>
                              <div style={{
                                fontSize: '0.9rem',
                                color: '#1a1a1a',
                                lineHeight: '1.6',
                                fontStyle: 'italic',
                                backgroundColor: '#ffffff',
                                padding: '0.75rem',
                                border: '1px solid #e5e5e5'
                              }}>
                                "{source.thesis_statement}"
                              </div>
                            </div>
                          )}

                          {source.type === 'chunk' && source.content && (
                            <div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#666666',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.5rem'
                              }}>
                                Text Excerpt (sent to LLM)
                              </div>
                              <div style={{
                                fontSize: '0.9rem',
                                color: '#1a1a1a',
                                lineHeight: '1.6',
                                backgroundColor: '#ffffff',
                                padding: '0.75rem',
                                border: '1px solid #e5e5e5'
                              }}>
                                {source.content}...
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AskBen;