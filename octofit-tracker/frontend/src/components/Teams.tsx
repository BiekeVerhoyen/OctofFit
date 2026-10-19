import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => {
        if (active) setTeams(result);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading ? <p role="status">Loading teams...</p> : null}
        {error ? <p role="alert">Unable to load teams.</p> : null}
        {!loading && !error && teams.length === 0 ? <p>No teams yet.</p> : null}
        {!loading && !error && teams.length > 0 ? (
          <ul className="list-group">
            {teams.map((team) => (
              <li className="list-group-item" key={team.name}>
                <strong>{team.name}</strong>
                <span> · {team.members.length} members</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
