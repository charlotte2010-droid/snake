const { Redis } = require('@upstash/redis');

const KEY = 'snake_scores';

module.exports = async function handler(req, res) {
  let redis;
  try {
    redis = Redis.fromEnv();
  } catch (e) {
    return res.status(500).json({ error: 'Redis not configured', detail: e.message });
  }

  try {
    if (req.method === 'GET') {
      const scores = (await redis.get(KEY)) ?? [];
      return res.status(200).json(scores);
    }

    if (req.method === 'POST') {
      const { name, score } = req.body ?? {};
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'invalid input' });
      }
      const entry = { name: String(name || 'AAA').slice(0, 12), score: Math.floor(score) };
      const scores = (await redis.get(KEY)) ?? [];
      scores.push(entry);
      scores.sort((a, b) => b.score - a.score);
      const rank = scores.findIndex(e => e.name === entry.name && e.score === entry.score) + 1;
      scores.splice(10);
      await redis.set(KEY, scores);
      return res.status(200).json({ rank, scores });
    }

    res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
