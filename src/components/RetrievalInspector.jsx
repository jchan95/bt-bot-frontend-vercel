import { useState } from 'react';
import { inspectRetrieval, getArticleComparison } from '../services/api';

function RetrievalInspector({ persistedState, onStateChange }) {
  const [query, setQuery] = useState(persistedState?.query || '');
  const [threshold, setThreshold] = useState(persistedState?.threshold || 0.3);
  const [limit, setLimit] = useState(persistedState?.limit || 5);
  const [results, setResults] = useState(persistedState?.results || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const updateState = (updates) => {
    onStateChange?.((prev) => ({ ...prev, ...updates }));
  };

  const handleInspect = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedArticle(null);
    setComparison(null);

    try {
      const data = await inspectRetrieval(query, { limit, threshold });
      setResults(data);
      updateState({ query, threshold, limit, results: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewComparison = async (issueId) => {
    setSelectedArticle(issueId);
    setLoadingComparison(true);
    try {
      const data = await getArticleComparison(issueId);
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingComparison(false);
    }
  };

  const getSimilarityColor = (score, threshold) => {
    if (score >= threshold) return '#16a34a';
    if (score >= threshold * 0.7) return '#ca8a04';
    return '#dc2626';
  };

  const formatScore = (score) => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Header */}
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
          Retrieval Inspector
        </h2>
        <p style={{ color: '#666666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Explore the two-tier RAG retrieval process. See how queries match against distillations (Tier 1)
          and raw chunks (Tier 2), with similarity scores and routing decisions.
        </p>

        {/* Query Form */}
        <form onSubmit={handleInspect}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a query to inspect retrieval..."
              style={{
                flex: '1 1 400px',
                padding: '0.75rem',
                fontSize: '1rem',
                fontFamily: "Georgia, 'Times New Roman', serif",
                border: '1px solid #e5e5e5',
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
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
              {loading ? 'Searching...' : 'Inspect'}
            </button>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#666666' }}>Threshold:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
              <span style={{ fontWeight: '600', width: '45px' }}>{formatScore(threshold)}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#666666' }}>Results per tier:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                style={{
                  padding: '0.25rem',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  border: '1px solid #e5e5e5'
                }}
              >
                {[3, 5, 10, 15].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
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
        <>
          {/* Decision Panel */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0369a1', fontSize: '1.1rem' }}>
              Routing Decision
            </h3>

            {/* Decision Flow Visualization */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <span style={{
                backgroundColor: '#ffffff',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e5e5e5',
              }}>
                Query
              </span>
              <span style={{ color: '#666666' }}>→</span>
              <span style={{
                backgroundColor: '#ffffff',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e5e5e5',
              }}>
                Embed
              </span>
              <span style={{ color: '#666666' }}>→</span>
              <span style={{
                backgroundColor: results.decision.distillation_max_score >= threshold ? '#dcfce7' : '#fee2e2',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${results.decision.distillation_max_score >= threshold ? '#86efac' : '#fecaca'}`,
              }}>
                Distillations: {results.decision.distillation_max_score ? formatScore(results.decision.distillation_max_score) : 'N/A'}
              </span>
              {results.decision.tier_used === 'hybrid' && (
                <>
                  <span style={{ color: '#666666' }}>+</span>
                  <span style={{
                    backgroundColor: results.decision.chunk_max_score >= threshold ? '#dcfce7' : '#fee2e2',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${results.decision.chunk_max_score >= threshold ? '#86efac' : '#fecaca'}`,
                  }}>
                    Chunks: {results.decision.chunk_max_score ? formatScore(results.decision.chunk_max_score) : 'N/A'}
                  </span>
                </>
              )}
              <span style={{ color: '#666666' }}>→</span>
              <span style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '0.5rem 0.75rem',
                fontWeight: '600',
              }}>
                {results.decision.tier_used.toUpperCase()}
              </span>
            </div>

            <p style={{ margin: 0, color: '#0369a1', lineHeight: '1.5' }}>
              {results.decision.reasoning}
              {results.decision.needs_precision && (
                <span style={{
                  marginLeft: '0.5rem',
                  backgroundColor: '#fef3c7',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.8rem',
                  color: '#92400e'
                }}>
                  Precision keywords detected
                </span>
              )}
            </p>
          </div>

          {/* Two-Panel Results */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Tier 1: Distillations */}
            <div style={{
              flex: '1 1 400px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e5e5',
                backgroundColor: '#dbeafe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>
                    Tier 1: Distillations
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#3b82f6' }}>
                    Structured analytical summaries
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#ffffff',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#1e40af'
                }}>
                  {results.distillations_above_threshold}/{results.distillation_count} above threshold
                </span>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {results.distillations.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                    No distillations found
                  </div>
                ) : (
                  results.distillations.map((d, idx) => (
                    <div
                      key={d.distillation_id}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e5e5e5',
                        backgroundColor: d.above_threshold ? '#f0fdf4' : 'transparent',
                        opacity: d.above_threshold ? 1 : 0.6
                      }}
                    >
                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '0.25rem' }}>
                            {d.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {d.publication_date}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem'
                        }}>
                          <span style={{
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            color: getSimilarityColor(d.similarity, threshold)
                          }}>
                            {formatScore(d.similarity)}
                          </span>
                          {d.above_threshold && (
                            <span style={{
                              fontSize: '0.7rem',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              padding: '0.1rem 0.3rem'
                            }}>
                              ✓ ABOVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thesis */}
                      {d.thesis_statement && (
                        <div style={{
                          backgroundColor: '#f8f9fa',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          lineHeight: '1.5',
                          borderLeft: '3px solid #3b82f6'
                        }}>
                          <strong>Thesis:</strong> {d.thesis_statement}
                        </div>
                      )}

                      {/* Key Claims */}
                      {d.key_claims && d.key_claims.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666666', marginBottom: '0.25rem' }}>
                            Key Claims:
                          </div>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '1.25rem',
                            fontSize: '0.85rem',
                            color: '#1a1a1a'
                          }}>
                            {d.key_claims.slice(0, 3).map((claim, i) => (
                              <li key={i} style={{ marginBottom: '0.25rem' }}>
                                {claim.claim}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Topics & Entities */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {d.topics?.slice(0, 4).map((topic, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1e40af',
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* View Comparison Button */}
                      <button
                        onClick={() => handleViewComparison(d.issue_id)}
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e5e5e5',
                          fontSize: '0.8rem',
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          cursor: 'pointer',
                          color: '#666666'
                        }}
                      >
                        View Chunk Comparison →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tier 2: Chunks */}
            <div style={{
              flex: '1 1 400px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e5e5',
                backgroundColor: '#fff7ed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#c2410c', fontSize: '1rem' }}>
                    Tier 2: Chunks
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#ea580c' }}>
                    Raw text segments (~500 tokens)
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#ffffff',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#c2410c'
                }}>
                  {results.chunks_above_threshold}/{results.chunk_count} above threshold
                </span>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {results.chunks.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                    No chunks found
                  </div>
                ) : (
                  results.chunks.map((c, idx) => (
                    <div
                      key={c.chunk_id}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e5e5e5',
                        backgroundColor: c.above_threshold ? '#fef3c7' : 'transparent',
                        opacity: c.above_threshold ? 1 : 0.6
                      }}
                    >
                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '0.25rem' }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {c.publication_date} • Chunk #{c.chunk_index + 1}
                            {c.token_count && ` • ${c.token_count} tokens`}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem'
                        }}>
                          <span style={{
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            color: getSimilarityColor(c.similarity, threshold)
                          }}>
                            {formatScore(c.similarity)}
                          </span>
                          {c.above_threshold && (
                            <span style={{
                              fontSize: '0.7rem',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              padding: '0.1rem 0.3rem'
                            }}>
                              ✓ ABOVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '0.75rem',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        color: '#374151',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        borderLeft: '3px solid #ea580c'
                      }}>
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Article Comparison Modal */}
          {comparison && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
              onClick={() => { setComparison(null); setSelectedArticle(null); }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  maxWidth: '1000px',
                  maxHeight: '90vh',
                  width: '100%',
                  overflowY: 'auto',
                  border: '1px solid #e5e5e5',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e5e5',
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>
                        {comparison.article?.title}
                      </h3>
                      <p style={{ margin: 0, color: '#666666', fontSize: '0.9rem' }}>
                        {comparison.article?.publication_date} • {comparison.article?.word_count} words •
                        {comparison.stats?.total_chunks} chunks
                      </p>
                    </div>
                    <button
                      onClick={() => { setComparison(null); setSelectedArticle(null); }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#1a1a1a',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "Georgia, 'Times New Roman', serif"
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Side by Side Comparison */}
                <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
                  {/* Distillation */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 1rem 0',
                      color: '#1e40af',
                      padding: '0.5rem',
                      backgroundColor: '#dbeafe'
                    }}>
                      Distillation (Structured)
                    </h4>
                    {comparison.distillation ? (
                      <div style={{ fontSize: '0.9rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <strong>Thesis:</strong>
                          <p style={{ margin: '0.25rem 0', lineHeight: '1.5' }}>
                            {comparison.distillation.thesis_statement}
                          </p>
                        </div>
                        {comparison.distillation.key_claims?.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <strong>Key Claims:</strong>
                            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem' }}>
                              {comparison.distillation.key_claims.map((c, i) => (
                                <li key={i}>{c.claim}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {comparison.distillation.topics?.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <strong>Topics:</strong>{' '}
                            {comparison.distillation.topics.join(', ')}
                          </div>
                        )}
                        <div style={{
                          backgroundColor: '#f0f9ff',
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          color: '#0369a1'
                        }}>
                          Confidence: {(comparison.distillation.confidence_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#666666' }}>No distillation available</p>
                    )}
                  </div>

                  {/* Chunks */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 1rem 0',
                      color: '#c2410c',
                      padding: '0.5rem',
                      backgroundColor: '#fff7ed'
                    }}>
                      Raw Chunks ({comparison.chunks?.length || 0})
                    </h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {comparison.chunks?.map((chunk, idx) => (
                        <div
                          key={chunk.chunk_id}
                          style={{
                            marginBottom: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#f8f9fa',
                            fontSize: '0.85rem',
                            lineHeight: '1.5'
                          }}
                        >
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                            color: '#666666',
                            fontSize: '0.8rem'
                          }}>
                            Chunk #{chunk.chunk_index + 1} ({chunk.token_count} tokens)
                          </div>
                          {chunk.content.substring(0, 300)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666666', marginBottom: '1rem' }}>
            Enter a query to inspect the retrieval process
          </h3>
          <p style={{ color: '#999999', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            This tool shows how your query matches against both distillations (Tier 1: structured summaries)
            and chunks (Tier 2: raw text). You'll see similarity scores, threshold comparisons,
            and the routing decision logic.
          </p>
          <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666666' }}>
            <strong>Try queries like:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              "What is aggregation theory?" • "Apple's business model" • "How does Netflix compete?"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetrievalInspector;
