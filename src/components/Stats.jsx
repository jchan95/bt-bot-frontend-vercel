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

  if (loading) return <p style={{ fontFamily: "Georgia, serif" }}>Loading...</p>;
  if (error) return <p style={{ color: '#cc0000', fontFamily: "Georgia, serif" }}>Error: {error}</p>;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const exampleQuestions = [
    "How would Ben analyze Apple's services strategy?",
    "What does Aggregation Theory say about AI?",
    "How has Ben's thinking on Google evolved?",
    "Apply the value chain framework to streaming",
  ];

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: '#FFF8F0',
        border: '1px solid #FFE4CC',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          margin: '0 0 0.75rem 0',
          color: '#1a1a1a',
          fontSize: '1.3rem',
          fontWeight: '600'
        }}>
          Welcome to the Stratechery Bot
        </h2>
        <p style={{ color: '#444', lineHeight: 1.6, margin: 0 }}>
          This bot helps you explore Ben Thompson's thinking from Stratechery.
          Ask questions about tech strategy, business models, or have it apply
          Ben's frameworks (Aggregation Theory, incentive analysis, etc.) to new topics.
        </p>
      </div>

      {/* Archive Coverage */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#FF5A09' }}>
            {stats?.total_articles?.toLocaleString() || 0}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Articles Indexed
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
            {stats?.date_range?.oldest && stats?.date_range?.newest ? (
              <>
                {formatDate(stats.date_range.oldest)} — {formatDate(stats.date_range.newest)}
              </>
            ) : 'Loading...'}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Archive Coverage
          </div>
        </div>
      </div>

      {/* Topics */}
      {stats?.top_topics?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '0.75rem',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Topics in the Archive
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.top_topics.map((topic, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#444',
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Example Questions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          color: '#666',
          marginBottom: '0.75rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Try Asking
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {exampleQuestions.map((q, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e5e5e5',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#333',
                fontStyle: 'italic',
              }}
            >
              "{q}"
            </div>
          ))}
        </div>
      </div>

      {/* Recent Articles */}
      {stats?.recent_articles?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '0.75rem',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Recent Articles in Archive
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {stats.recent_articles.map((article, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '0.9rem',
                  color: '#444',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{article.title}</span>
                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                  {formatDate(article.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details (collapsed/minimal) */}
      <details style={{ marginTop: '2rem' }}>
        <summary style={{
          cursor: 'pointer',
          color: '#888',
          fontSize: '0.85rem',
          marginBottom: '0.5rem',
        }}>
          Technical Details
        </summary>
        <div style={{
          fontSize: '0.85rem',
          color: '#666',
          padding: '0.75rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
        }}>
          <div>{stats?.total_distillations || 0} distillations (article-level summaries)</div>
          <div>{stats?.total_chunks || 0} text chunks for detailed retrieval</div>
          <div>{stats?.distillation_embeddings || 0} + {stats?.chunk_embeddings || 0} embeddings indexed</div>
        </div>
      </details>
    </div>
  );
}

export default Stats;
