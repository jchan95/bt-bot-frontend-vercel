const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function query(question, options = {}) {
  const response = await fetch(`${API_BASE}/query/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      limit: options.limit || 5,
      threshold: options.threshold || 0.3,
      mode: options.mode || 'auto'  // 'auto', 'distillations', 'chunks', 'hybrid', 'reasoning'
    })
  });
  if (!response.ok) throw new Error('Query failed');
  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/embeddings/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function getEvalExamples() {
  const response = await fetch(`${API_BASE}/eval/examples`);
  if (!response.ok) throw new Error('Failed to fetch eval examples');
  return response.json();
}

export async function getEvalRuns() {
  const response = await fetch(`${API_BASE}/eval/runs`);
  if (!response.ok) throw new Error('Failed to fetch eval runs');
  return response.json();
}

export async function runEval(config = {}) {
  const response = await fetch(`${API_BASE}/eval/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('Eval run failed');
  return response.json();
}

export async function searchDistillations(q, threshold = 0.3, limit = 20) {
  const response = await fetch(
    `${API_BASE}/embeddings/search/distillations?q=${encodeURIComponent(q)}&threshold=${threshold}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

export async function inspectRetrieval(query, options = {}) {
  const response = await fetch(`${API_BASE}/retrieval/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: options.limit || 5,
      threshold: options.threshold || 0.3
    })
  });
  if (!response.ok) throw new Error('Retrieval inspection failed');
  return response.json();
}

export async function getArticleComparison(issueId) {
  const response = await fetch(`${API_BASE}/retrieval/article/${issueId}/comparison`);
  if (!response.ok) throw new Error('Failed to fetch article comparison');
  return response.json();
}

export async function evalCitationAccuracy(question) {
  const response = await fetch(`${API_BASE}/eval/citation-accuracy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!response.ok) throw new Error('Citation accuracy eval failed');
  return response.json();
}

export async function evalCitationAccuracyBatch() {
  const response = await fetch(`${API_BASE}/eval/citation-accuracy/batch`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Batch citation accuracy eval failed');
  return response.json();
}

export async function getCitationAccuracyRuns(limit = 10) {
  const response = await fetch(`${API_BASE}/eval/citation-accuracy/runs?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch citation accuracy runs');
  return response.json();
}

export async function getCitationAccuracyRunDetails(runId) {
  const response = await fetch(`${API_BASE}/eval/citation-accuracy/runs/${runId}`);
  if (!response.ok) throw new Error('Failed to fetch citation accuracy run details');
  return response.json();
}