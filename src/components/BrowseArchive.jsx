import { useState } from 'react';
import { searchDistillations } from '../services/api';

function BrowseArchive({ persistedState, onStateChange }) {
  // Use persisted state from parent, with local loading state
  const [searchQuery, setSearchQuery] = useState(persistedState?.searchQuery || '');
  const [results, setResults] = useState(persistedState?.results || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(persistedState?.error || null);
  const [expandedId, setExpandedId] = useState(persistedState?.expandedId || null);

  // Sync state changes to parent for persistence
  const updateState = (updates) => {
    onStateChange?.((prev) => ({ ...prev, ...updates }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    updateState({ error: null, results: null });

    try {
      const data = await searchDistillations(searchQuery, 0.25, 20);
      setResults(data);
      updateState({ searchQuery, results: data, error: null });
    } catch (err) {
      setError(err.message);
      updateState({ searchQuery, error: err.message, results: null });
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    updateState({ searchQuery: newQuery });
  };

  const toggleExpand = (id) => {
    const newExpandedId = expandedId === id ? null : id;
    setExpandedId(newExpandedId);
    updateState({ expandedId: newExpandedId });
  };

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Search Form */}
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
          Browse Archive
        </h2>
        <p style={{ color: '#666666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Search through 10+ years of Stratechery articles using semantic search.
        </p>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder="e.g., Apple services strategy, aggregation theory, Netflix..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                fontFamily: "Georgia, 'Times New Roman', serif",
                border: '1px solid #e5e5e5',
              }}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#cccccc' : '#FF5A09',
                color: '#ffffff',
                border: 'none',
                fontSize: '1rem',
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
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

      {/* Results */}
      {results && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
        }}>
          <div style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f8f9fa'
          }}>
            <strong>{results.results?.length || 0}</strong> articles found
          </div>

          {results.results && results.results.length > 0 ? (
            <div>
              {results.results.map((item, idx) => (
                <div
                  key={item.distillation_id || idx}
                  style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #e5e5e5',
                  }}
                >
                  {/* Header Row */}
                  <div 
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleExpand(item.distillation_id || idx)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#1a1a1a',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        flex: 1
                      }}>
                        {item.title || 'Untitled'}
                      </h3>
                      <span style={{ 
                        color: '#FF5A09', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginLeft: '1rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {(item.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>

                    {item.publication_date && (
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#666666',
                        marginBottom: '0.75rem'
                      }}>
                        {new Date(item.publication_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}

                    {/* Thesis Statement */}
                    {item.thesis_statement && (
                      <p style={{ 
                        margin: 0,
                        color: '#1a1a1a',
                        lineHeight: '1.6',
                        fontSize: '0.95rem'
                      }}>
                        {item.thesis_statement}
                      </p>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedId === (item.distillation_id || idx) && (
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid #e5e5e5'
                    }}>
                      {/* Topics */}
                      {item.topics && item.topics.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#666666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Topics
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {item.topics.map((topic, i) => (
                              <span
                                key={i}
                                style={{
                                  backgroundColor: '#f8f9fa',
                                  border: '1px solid #e5e5e5',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.85rem',
                                  color: '#1a1a1a'
                                }}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Claims */}
                      {item.key_claims && item.key_claims.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#666666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Key Claims
                          </div>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '1.25rem',
                            color: '#1a1a1a',
                            lineHeight: '1.7'
                          }}>
                            {item.key_claims.map((claim, i) => (
                              <li key={i} style={{ marginBottom: '0.25rem' }}>
                                {typeof claim === 'string' ? claim : claim.claim || JSON.stringify(claim)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Entities */}
                      {item.entities && Object.keys(item.entities).length > 0 && (
                        <div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#666666',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Entities
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.entries(item.entities).map(([type, names]) => (
                              Array.isArray(names) ? names.map((name, i) => (
                                <span
                                  key={`${type}-${i}`}
                                  style={{
                                    backgroundColor: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.85rem',
                                    color: '#9a3412'
                                  }}
                                >
                                  {name}
                                </span>
                              )) : (
                                <span
                                  key={type}
                                  style={{
                                    backgroundColor: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.85rem',
                                    color: '#9a3412'
                                  }}
                                >
                                  {String(names)}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand/Collapse indicator */}
                  <div 
                    style={{ 
                      marginTop: '0.75rem',
                      fontSize: '0.85rem',
                      color: '#0066cc',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleExpand(item.distillation_id || idx)}
                  >
                    {expandedId === (item.distillation_id || idx) ? '▲ Show less' : '▼ Show more'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
              No articles found matching your query.
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#666666'
        }}>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            Enter a search term to explore the archive
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Try: "aggregation theory", "Apple strategy", "Netflix", "Google antitrust"
          </p>
        </div>
      )}
    </div>
  );
}

export default BrowseArchive;