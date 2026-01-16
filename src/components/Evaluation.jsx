import { useState, useEffect } from 'react';
import { getEvalExamples, getEvalRuns, runEval, evalCitationAccuracy, evalCitationAccuracyBatch, getCitationAccuracyRuns, getCitationAccuracyRunDetails } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  // Citation accuracy state
  const [citationQuestion, setCitationQuestion] = useState('');
  const [citationResult, setCitationResult] = useState(persistedState?.citationResult || null);
  const [citationBatchResult, setCitationBatchResult] = useState(persistedState?.citationBatchResult || null);
  const [runningCitation, setRunningCitation] = useState(false);
  const [citationRuns, setCitationRuns] = useState(persistedState?.citationRuns || []);
  const [selectedCitationRun, setSelectedCitationRun] = useState(null);
  const [citationRunDetails, setCitationRunDetails] = useState(null);

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
      const [examplesData, runsData, citationRunsData] = await Promise.all([
        getEvalExamples(),
        getEvalRuns(),
        getCitationAccuracyRuns()
      ]);
      setExamples(examplesData.examples || []);
      setRuns(runsData.runs || []);
      setCitationRuns(citationRunsData.runs || []);
      updateState({
        examples: examplesData.examples || [],
        runs: runsData.runs || [],
        citationRuns: citationRunsData.runs || []
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

  const handleCitationEval = async (e) => {
    e.preventDefault();
    if (!citationQuestion.trim()) return;

    setRunningCitation(true);
    setError(null);
    setCitationResult(null);
    try {
      const result = await evalCitationAccuracy(citationQuestion);
      setCitationResult(result);
      updateState({ citationResult: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCitation(false);
    }
  };

  const handleCitationBatch = async () => {
    setRunningCitation(true);
    setError(null);
    setCitationBatchResult(null);
    try {
      const result = await evalCitationAccuracyBatch();
      setCitationBatchResult(result);
      updateState({ citationBatchResult: result });
      // Refresh runs list to show new run
      const citationRunsData = await getCitationAccuracyRuns();
      setCitationRuns(citationRunsData.runs || []);
      updateState({ citationRuns: citationRunsData.runs || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCitation(false);
    }
  };

  const handleSelectCitationRun = async (runId) => {
    setSelectedCitationRun(runId);
    try {
      const details = await getCitationAccuracyRunDetails(runId);
      setCitationRunDetails(details);
    } catch (err) {
      setError(err.message);
    }
  };

  const getCitationStatusColor = (status) => {
    if (status === 'valid') return '#16a34a';
    if (status === 'exists_but_misused') return '#ca8a04';
    return '#dc2626';
  };

  const getAccuracyColor = (score) => {
    if (score >= 0.8) return '#16a34a';
    if (score >= 0.5) return '#ca8a04';
    return '#dc2626';
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
          Test and compare both query modes using LLM-as-judge scoring.
        </p>

        {/* Section Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['runs', 'citations', 'examples'].map(section => {
            const isActive = activeSection === section;
            const isRAG = section === 'runs';
            const isReasoning = section === 'citations';

            // Determine colors based on section type
            let bgColor, textColor, borderColor;
            if (isActive) {
              if (isRAG) {
                bgColor = '#2563eb'; // blue
                textColor = '#ffffff';
                borderColor = '#2563eb';
              } else if (isReasoning) {
                bgColor = '#16a34a'; // green
                textColor = '#ffffff';
                borderColor = '#16a34a';
              } else {
                bgColor = '#1a1a1a';
                textColor = '#ffffff';
                borderColor = '#1a1a1a';
              }
            } else {
              bgColor = '#f8f9fa';
              textColor = '#1a1a1a';
              borderColor = '#e5e5e5';
            }

            return (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  updateState({ activeSection: section });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: bgColor,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  fontSize: '0.9rem',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  cursor: 'pointer',
                }}
              >
                {section === 'runs' ? 'RAG Mode Eval' : section === 'citations' ? 'Reasoning Mode Eval' : 'Test Questions'}
              </button>
            );
          })}
        </div>

        {/* Section description */}
        <div style={{
          fontSize: '0.85rem',
          color: '#666666',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: activeSection === 'runs' ? '#eff6ff' : activeSection === 'citations' ? '#f0fdf4' : '#f8f9fa',
          borderLeft: `3px solid ${activeSection === 'runs' ? '#2563eb' : activeSection === 'citations' ? '#16a34a' : '#666666'}`,
        }}>
          {activeSection === 'runs' && (
            <>Evaluates <strong>RAG Mode</strong> (traditional retrieval) — scores answers on relevance, faithfulness, and completeness using distillation and chunk retrieval.</>
          )}
          {activeSection === 'citations' && (
            <>Evaluates <strong>Reasoning Mode</strong> (experimental) — checks if inline citations in reasoning-first answers match real articles and accurately represent their content.</>
          )}
          {activeSection === 'examples' && (
            <>These are the <strong>test questions</strong> used for evaluation runs. Both RAG Mode and Reasoning Mode evals use these same questions to ensure comparable results.</>
          )}
        </div>

        {/* Run Eval Button */}
        {activeSection === 'runs' && (
          <button
            onClick={handleRunEval}
            disabled={runningEval || examples.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: runningEval ? '#cccccc' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '1rem',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: '600',
              cursor: runningEval ? 'not-allowed' : 'pointer',
            }}
          >
            {runningEval ? 'Running Evaluation...' : `Run RAG Mode Eval (${examples.length} questions)`}
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
              backgroundColor: '#eff6ff',
              fontWeight: '600',
              color: '#1e40af'
            }}>
              RAG Mode Runs ({runs.length})
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
                    backgroundColor: selectedRun === run.run_id ? '#eff6ff' : 'transparent',
                    borderLeft: selectedRun === run.run_id ? '3px solid #2563eb' : '3px solid transparent',
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
                  backgroundColor: '#eff6ff'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, color: '#1e40af' }}>RAG Mode Results</h3>
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
          {/* Examples List Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '0.25rem' }}>
              {examples.length} Test Questions
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666666' }}>
              These questions are used to evaluate both RAG Mode and Reasoning Mode
            </div>
          </div>

          {examples.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
              No test questions yet. Add some questions to evaluate the system.
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

      {/* Citation Accuracy Section */}
      {activeSection === 'citations' && (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* Historical Runs List */}
          <div style={{
            flex: '0 0 300px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e5e5',
              backgroundColor: '#f0fdf4',
              fontWeight: '600',
              color: '#166534'
            }}>
              Reasoning Mode Runs ({citationRuns.length})
            </div>

            {/* Run New Batch Button */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
              <button
                onClick={handleCitationBatch}
                disabled={runningCitation || examples.length === 0}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: runningCitation ? '#cccccc' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: '600',
                  cursor: runningCitation ? 'not-allowed' : 'pointer',
                }}
              >
                {runningCitation ? 'Running...' : `Run Reasoning Eval (${examples.length})`}
              </button>
            </div>

            {citationRuns.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                No reasoning mode runs yet.
              </div>
            ) : (
              citationRuns.map(run => (
                <div
                  key={run.run_id}
                  onClick={() => handleSelectCitationRun(run.run_id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    backgroundColor: selectedCitationRun === run.run_id ? '#f0fdf4' : 'transparent',
                    borderLeft: selectedCitationRun === run.run_id ? '3px solid #16a34a' : '3px solid transparent',
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
                      color: getAccuracyColor(run.overall_accuracy),
                      fontWeight: '600'
                    }}>
                      {(run.overall_accuracy * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666666', marginBottom: '0.25rem' }}>
                    {formatDate(run.started_at)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888888' }}>
                    <span style={{ color: '#16a34a' }}>{run.valid_citations} valid</span>
                    {' · '}
                    <span style={{ color: '#ca8a04' }}>{run.misused_citations} misused</span>
                    {' · '}
                    <span style={{ color: '#dc2626' }}>{run.hallucinated_citations} hallucinated</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main Content Area */}
          <div style={{
            flex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
          }}>
            {/* Header with single question test */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e5e5',
              backgroundColor: '#f0fdf4'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1rem' }}>
                Reasoning Mode — Citation Accuracy
              </h3>
              <p style={{ color: '#666666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Tests if inline citations match real articles and accurately represent their content.
              </p>

              {/* Single question form */}
              <form onSubmit={handleCitationEval}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={citationQuestion}
                    onChange={(e) => setCitationQuestion(e.target.value)}
                    placeholder="Test a single question..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      fontSize: '0.95rem',
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      border: '1px solid #e5e5e5',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={runningCitation || !citationQuestion.trim()}
                    style={{
                      padding: '0.75rem 1.25rem',
                      backgroundColor: runningCitation ? '#cccccc' : '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontWeight: '600',
                      cursor: runningCitation ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {runningCitation ? 'Running...' : 'Test'}
                  </button>
                </div>
              </form>
            </div>

            {/* Selected Historical Run Details */}
            {selectedCitationRun && citationRunDetails ? (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: '#1a1a1a' }}>
                    Run from {formatDate(citationRunDetails.started_at)}
                  </h4>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: getAccuracyColor(citationRunDetails.overall_accuracy)
                  }}>
                    {(citationRunDetails.overall_accuracy * 100).toFixed(0)}% overall
                  </span>
                </div>

                {/* Aggregate Stats */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  <span><strong>{citationRunDetails.total_citations}</strong> total citations</span>
                  <span style={{ color: '#16a34a' }}><strong>{citationRunDetails.valid_citations}</strong> valid</span>
                  <span style={{ color: '#ca8a04' }}><strong>{citationRunDetails.misused_citations}</strong> misused</span>
                  <span style={{ color: '#dc2626' }}><strong>{citationRunDetails.hallucinated_citations}</strong> hallucinated</span>
                </div>

                {/* Per-question breakdown */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {citationRunDetails.results?.map((r, idx) => (
                    <div key={idx} style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid #e5e5e5'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: '500' }}>{r.question}</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666666' }}>
                            {r.valid}/{r.total_citations} valid
                          </span>
                          <span style={{
                            fontWeight: '600',
                            color: getAccuracyColor(r.accuracy_score)
                          }}>
                            {(r.accuracy_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Citation details for this question */}
                      {r.details?.map((c, cidx) => (
                        <div key={cidx} style={{
                          padding: '0.5rem',
                          marginTop: '0.25rem',
                          marginLeft: '1rem',
                          backgroundColor: c.status === 'valid' ? '#f0fdf4' : c.status === 'exists_but_misused' ? '#fefce8' : '#fef2f2',
                          borderLeft: `2px solid ${getCitationStatusColor(c.status)}`,
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>{c.citation}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              backgroundColor: getCitationStatusColor(c.status),
                              color: '#fff',
                              borderRadius: '2px'
                            }}>
                              {c.status}
                            </span>
                          </div>
                          <div style={{ color: '#666666', marginTop: '0.25rem' }}>
                            {c.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : citationResult ? (
              /* Single Result */
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: '#1a1a1a' }}>Single Question Result</h4>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: getAccuracyColor(citationResult.citation_eval?.accuracy_score)
                  }}>
                    {(citationResult.citation_eval?.accuracy_score * 100).toFixed(0)}% accurate
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '1rem' }}>
                  <strong>Question:</strong> {citationResult.question}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <span><strong>{citationResult.citation_eval?.total_citations}</strong> citations found</span>
                  <span style={{ color: '#16a34a' }}><strong>{citationResult.citation_eval?.valid}</strong> valid</span>
                  <span style={{ color: '#ca8a04' }}><strong>{citationResult.citation_eval?.exists_but_misused}</strong> misused</span>
                  <span style={{ color: '#dc2626' }}><strong>{citationResult.citation_eval?.hallucinated}</strong> hallucinated</span>
                </div>

                {/* Citation Details */}
                {citationResult.citation_eval?.details?.map((c, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: c.status === 'valid' ? '#f0fdf4' : c.status === 'exists_but_misused' ? '#fefce8' : '#fef2f2',
                    border: `1px solid ${getCitationStatusColor(c.status)}40`,
                    borderLeft: `3px solid ${getCitationStatusColor(c.status)}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{c.citation}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.1rem 0.5rem',
                        backgroundColor: getCitationStatusColor(c.status),
                        color: '#fff',
                        borderRadius: '3px'
                      }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                      <strong>Claim:</strong> {c.claim}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#888888', marginTop: '0.25rem' }}>
                      {c.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : citationBatchResult ? (
              /* Latest Batch Result (not persisted yet) */
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: '#1a1a1a' }}>Latest Batch Results ({citationBatchResult.total_examples} examples)</h4>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: getAccuracyColor(citationBatchResult.aggregate?.overall_accuracy)
                  }}>
                    {(citationBatchResult.aggregate?.overall_accuracy * 100).toFixed(0)}% overall
                  </span>
                </div>

                {/* Aggregate Stats */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  <span><strong>{citationBatchResult.aggregate?.total_citations}</strong> total citations</span>
                  <span style={{ color: '#16a34a' }}><strong>{citationBatchResult.aggregate?.valid}</strong> valid</span>
                  <span style={{ color: '#ca8a04' }}><strong>{citationBatchResult.aggregate?.exists_but_misused}</strong> misused</span>
                  <span style={{ color: '#dc2626' }}><strong>{citationBatchResult.aggregate?.hallucinated}</strong> hallucinated</span>
                </div>

                {/* Per-question breakdown */}
                {citationBatchResult.results?.map((r, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e5e5'
                  }}>
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{r.question}</span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#666666' }}>
                        {r.valid}/{r.total_citations} valid
                      </span>
                      <span style={{
                        fontWeight: '600',
                        color: getAccuracyColor(r.accuracy_score)
                      }}>
                        {(r.accuracy_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
                {citationRuns.length > 0
                  ? 'Select a run from the left to view details, or test a single question above.'
                  : 'Run a batch evaluation or test a single question to see citation accuracy results.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Evaluation;
