import { useState, useEffect } from 'react';
import { getEvalExamples, getEvalRuns, runEval } from '../services/api';

const API_BASE = 'http://localhost:8000';

function Evaluation({ persistedState, onStateChange }) {
  // Use persisted state from parent
  const [examples, setExamples] = useState(persistedState?.examples || []);
  const [runs, setRuns] = useState(persistedState?.runs || []);
  const [selectedRun, setSelectedRun] = useState(persistedState?.selectedRun || null);
  const [runDetails, setRunDetails] = useState(persistedState?.runDetails || null);
  const [loading, setLoading] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(persistedState?.activeSection || 'runs');

  // New example form
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingExample, setAddingExample] = useState(false);

  // Sync state changes to parent for persistence
  const updateState = (updates) => {
    onStateChange?.((prev) => ({ ...prev, ...updates }));
  };

  // Load data on mount
  useEffect(() => {
    if (examples.length === 0 && runs.length === 0) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [examplesData, runsData] = await Promise.all([
        getEvalExamples(),
        getEvalRuns()
      ]);
      setExamples(examplesData.examples || []);
      setRuns(runsData.runs || []);
      updateState({
        examples: examplesData.examples || [],
        runs: runsData.runs || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEval = async () => {
    setRunningEval(true);
    setError(null);
    try {
      const result = await runEval({ mode: 'auto', limit: 5, threshold: 0.3 });
      // Refresh runs list
      const runsData = await getEvalRuns();
      setRuns(runsData.runs || []);
      updateState({ runs: runsData.runs || [] });
      // Auto-select the new run
      if (result.run_id) {
        handleSelectRun(result.run_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningEval(false);
    }
  };

  const handleSelectRun = async (runId) => {
    setSelectedRun(runId);
    updateState({ selectedRun: runId });
    try {
      const response = await fetch(`${API_BASE}/eval/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run details');
      const details = await response.json();
      setRunDetails(details);
      updateState({ runDetails: details });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddExample = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setAddingExample(true);
    try {
      const response = await fetch(`${API_BASE}/eval/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          category: newCategory || null
        })
      });
      if (!response.ok) throw new Error('Failed to add example');

      // Refresh examples
      const examplesData = await getEvalExamples();
      setExamples(examplesData.examples || []);
      updateState({ examples: examplesData.examples || [] });
      setNewQuestion('');
      setNewCategory('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingExample(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#16a34a';
    if (score >= 3) return '#ca8a04';
    if (score >= 2) return '#ea580c';
    return '#dc2626';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          Evaluation
        </h2>
        <p style={{ color: '#666666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Test RAG quality using LLM-as-judge scoring on relevance, faithfulness, and completeness.
        </p>

        {/* Section Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['runs', 'examples'].map(section => (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section);
                updateState({ activeSection: section });
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeSection === section ? '#1a1a1a' : '#f8f9fa',
                color: activeSection === section ? '#ffffff' : '#1a1a1a',
                border: '1px solid #e5e5e5',
                fontSize: '0.9rem',
                fontFamily: "Georgia, 'Times New Roman', serif",
                cursor: 'pointer',
              }}
            >
              {section === 'runs' ? 'Eval Runs' : 'Test Examples'}
            </button>
          ))}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f8f9fa',
              color: '#666666',
              border: '1px solid #e5e5e5',
              fontSize: '0.9rem',
              fontFamily: "Georgia, 'Times New Roman', serif",
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Run Eval Button */}
        {activeSection === 'runs' && (
          <button
            onClick={handleRunEval}
            disabled={runningEval || examples.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: runningEval ? '#cccccc' : '#FF5A09',
              color: '#ffffff',
              border: 'none',
              fontSize: '1rem',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: '600',
              cursor: runningEval ? 'not-allowed' : 'pointer',
            }}
          >
            {runningEval ? 'Running Evaluation...' : `Run Evaluation (${examples.length} examples)`}
          </button>
        )}
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

      {/* Runs Section */}
      {activeSection === 'runs' && (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* Runs List */}
          <div style={{
            flex: '0 0 300px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e5e5',
              backgroundColor: '#f8f9fa',
              fontWeight: '600'
            }}>
              Recent Runs ({runs.length})
            </div>
            {runs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                No eval runs yet. Add examples and run an evaluation.
              </div>
            ) : (
              runs.map(run => (
                <div
                  key={run.run_id}
                  onClick={() => handleSelectRun(run.run_id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    backgroundColor: selectedRun === run.run_id ? '#fff7ed' : 'transparent',
                    borderLeft: selectedRun === run.run_id ? '3px solid #FF5A09' : '3px solid transparent',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>
                      {run.total_examples} examples
                    </span>
                    <span style={{
                      color: getScoreColor(run.avg_score),
                      fontWeight: '600'
                    }}>
                      {run.avg_score?.toFixed(2)}/5
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                    {formatDate(run.started_at)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Run Details */}
          <div style={{
            flex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}>
            {!selectedRun ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
                Select a run to view details
              </div>
            ) : !runDetails ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
                Loading...
              </div>
            ) : (
              <>
                {/* Run Summary */}
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e5e5',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, color: '#1a1a1a' }}>Run Results</h3>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: getScoreColor(runDetails.run?.avg_score)
                    }}>
                      {runDetails.run?.avg_score?.toFixed(2)}/5
                    </span>
                  </div>

                  {/* Score breakdown */}
                  {runDetails.results && runDetails.results.length > 0 && (
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{ color: '#666666' }}>Relevance: </span>
                        <span style={{ fontWeight: '600' }}>
                          {(runDetails.results.reduce((sum, r) => sum + (r.relevance_score || 0), 0) / runDetails.results.length).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#666666' }}>Faithfulness: </span>
                        <span style={{ fontWeight: '600' }}>
                          {(runDetails.results.reduce((sum, r) => sum + (r.faithfulness_score || 0), 0) / runDetails.results.length).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#666666' }}>Completeness: </span>
                        <span style={{ fontWeight: '600' }}>
                          {(runDetails.results.reduce((sum, r) => sum + (r.completeness_score || 0), 0) / runDetails.results.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Individual Results */}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {runDetails.results?.map((result, idx) => (
                    <div
                      key={result.result_id || idx}
                      style={{
                        padding: '1.25rem',
                        borderBottom: '1px solid #e5e5e5',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ fontWeight: '600', color: '#1a1a1a', flex: 1 }}>
                          {result.question}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginLeft: '1rem'
                        }}>
                          <span style={{
                            backgroundColor: result.retrieval_tier === 'distillations' ? '#dbeafe' :
                                           result.retrieval_tier === 'chunks' ? '#fff7ed' : '#f3e8ff',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            color: result.retrieval_tier === 'distillations' ? '#1d4ed8' :
                                   result.retrieval_tier === 'chunks' ? '#c2410c' : '#7c3aed',
                          }}>
                            {result.retrieval_tier}
                          </span>
                          <span style={{
                            fontWeight: '700',
                            color: getScoreColor(result.avg_score)
                          }}>
                            {result.avg_score?.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Score Bars */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        {[
                          { label: 'R', score: result.relevance_score, full: 'Relevance' },
                          { label: 'F', score: result.faithfulness_score, full: 'Faithfulness' },
                          { label: 'C', score: result.completeness_score, full: 'Completeness' }
                        ].map(({ label, score, full }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: '#666666', width: '15px' }} title={full}>{label}:</span>
                            <div style={{
                              width: '60px',
                              height: '8px',
                              backgroundColor: '#e5e5e5',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${(score / 5) * 100}%`,
                                height: '100%',
                                backgroundColor: getScoreColor(score),
                                transition: 'width 0.3s'
                              }} />
                            </div>
                            <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{score}</span>
                          </div>
                        ))}
                      </div>

                      {/* Judge Reasoning */}
                      {result.judge_reasoning && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666666',
                          backgroundColor: '#f8f9fa',
                          padding: '0.75rem',
                          lineHeight: '1.5'
                        }}>
                          {result.judge_reasoning}
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

      {/* Examples Section */}
      {activeSection === 'examples' && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
        }}>
          {/* Add Example Form */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1a1a1a', fontSize: '1rem' }}>
              Add Test Question
            </h3>
            <form onSubmit={handleAddExample}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter a test question..."
                  style={{
                    flex: '1 1 300px',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    border: '1px solid #e5e5e5',
                  }}
                />
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category (optional)"
                  style={{
                    flex: '0 1 150px',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    border: '1px solid #e5e5e5',
                  }}
                />
                <button
                  type="submit"
                  disabled={addingExample || !newQuestion.trim()}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: addingExample ? '#cccccc' : '#FF5A09',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: '600',
                    cursor: addingExample ? 'not-allowed' : 'pointer',
                  }}
                >
                  {addingExample ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>

          {/* Examples List */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e5e5',
            fontWeight: '600',
            color: '#666666'
          }}>
            {examples.length} test questions
          </div>

          {examples.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
              No test questions yet. Add some questions above to evaluate the RAG system.
            </div>
          ) : (
            examples.map((ex, idx) => (
              <div
                key={ex.example_id || idx}
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e5e5e5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#1a1a1a', marginBottom: '0.25rem' }}>
                    {ex.question}
                  </div>
                  {ex.category && (
                    <span style={{
                      fontSize: '0.8rem',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e5e5e5',
                      padding: '0.2rem 0.5rem',
                      color: '#666666'
                    }}>
                      {ex.category}
                    </span>
                  )}
                </div>
                {ex.difficulty && (
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#666666',
                    marginLeft: '1rem'
                  }}>
                    {ex.difficulty}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Evaluation;
