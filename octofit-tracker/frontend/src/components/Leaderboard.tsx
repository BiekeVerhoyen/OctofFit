import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setEntries(leaderboard);
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
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading ? <p role="status">Loading leaderboard...</p> : null}
        {error ? <p role="alert">Unable to load leaderboard.</p> : null}
        {!loading && !error && entries.length === 0 ? <p>No leaderboard scores yet.</p> : null}
        {!loading && !error && entries.length > 0 ? (
          <ol className="list-group list-group-numbered">
            {entries.map((entry) => (
              <li className="list-group-item d-flex justify-content-between" key={`${entry.rank}-${entry.teamName}`}>
                <span>{entry.teamName}</span>
                <strong>{entry.totalPoints} points</strong>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
