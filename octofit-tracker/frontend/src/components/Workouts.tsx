import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: result }) => {
        if (active) setSuggestions(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading ? <p role="status">Loading workout suggestions...</p> : null}
        {error ? <p role="alert">Unable to load workout suggestions.</p> : null}
        {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
        {!loading && !error && suggestions.length > 0 ? (
          <ul className="list-group">
            {suggestions.map((suggestion) => (
              <li className="list-group-item" key={suggestion.title}>
                <strong>{suggestion.title}</strong>
                <p className="mb-0">{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
