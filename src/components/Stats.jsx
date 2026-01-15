import { useState, useEffect } from 'react';
import { getStats } from '../services/api';

function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ fontFamily: "Georgia, serif" }}>Loading stats...</p>;
  if (error) return <p style={{ color: '#cc0000', fontFamily: "Georgia, serif" }}>Error: {error}</p>;

  const metrics = [
    { label: 'Articles', value: stats?.total_articles || 0 },
    { label: 'Distillations', value: stats?.total_distillations || 0 },
    { label: 'Distillation Embeddings', value: stats?.total_distillation_embeddings || 0 },
    { label: 'Chunks', value: stats?.total_chunks || 0 },
    { label: 'Chunk Embeddings', value: stats?.total_chunk_embeddings || 0 },
  ];

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <h2 style={{ 
        margin: '0 0 1.5rem 0', 
        color: '#1a1a1a',
        fontSize: '1.5rem',
        fontWeight: '600'
      }}>
        System Statistics
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              padding: '1.5rem',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#FF5A09',
              marginBottom: '0.5rem'
            }}>
              {metric.value.toLocaleString()}
            </div>
            <div style={{ color: '#666666', fontSize: '0.9rem' }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;