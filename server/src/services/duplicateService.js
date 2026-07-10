const Idea = require('../models/Idea');

/**
 * Finds ideas that look similar to the given title/problem statement, using
 * MongoDB's text index on { title, problemStatement }. Excludes Draft/Closed
 * ideas (drafts aren't visible to others yet, closed ones aren't actionable
 * duplicates) and the idea itself when editing.
 * @returns {Promise<Array>} up to 5 similar ideas, each with just enough
 * fields for the "similar ideas" preview list.
 */
async function findSimilarIdeas({ title, problemStatement, excludeId = null }) {
  const searchText = [title, problemStatement].filter(Boolean).join(' ').trim();
  if (!searchText) return [];

  const query = {
    $text: { $search: searchText },
    status: { $nin: ['Draft', 'Closed'] },
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const matches = await Idea.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .select('code title status domain department createdAt')
    .lean();

  return matches;
}

module.exports = { findSimilarIdeas };
