import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid activity input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const activity = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = activity;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) throw invalidInput();

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity user or team not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid team input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const team = input as Record<string, unknown>;
  const { name, mascot } = team;
  const members = team.members ?? [];
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) throw invalidInput();

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0 && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('_id name').lean();
  const teamNames = new Map(teams.map(({ _id, name }) => [_id.toString(), name]));

  return totals.flatMap(({ _id, totalPoints }, index) => {
    const teamName = teamNames.get(_id.toString());
    return teamName ? [{ teamName, totalPoints, rank: index + 1 }] : [];
  });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityType = recentActivity?.type.toLowerCase();
  const activityFocus = activityType && ['run', 'running', 'cycle', 'cycling', 'swim', 'swimming'].includes(activityType)
    ? 'endurance'
    : activityType;

  return workouts
    .map((workout) => {
      const matchesGoal = workout.focus.toLowerCase() === user.fitnessGoal.toLowerCase();
      const matchesActivity = Boolean(activityFocus && workout.focus.toLowerCase() === activityFocus);
      const reason = matchesGoal
        ? `Matches your ${user.fitnessGoal} goal${activityType ? ` and recent ${activityType} activity` : ''}.`
        : matchesActivity
          ? `Matches your recent ${activityType} activity.`
          : `Supports your ${user.fitnessGoal} goal.`;
      return { ...workout, reason, score: Number(matchesGoal) * 2 + Number(matchesActivity) };
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 1)
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
