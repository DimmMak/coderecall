import { Token, Question, Language } from './types';

// SQL keywords that the user needs to recall
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
  'LIKE', 'IS', 'NULL', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
  'OFFSET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'ON',
  'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'INSERT', 'INTO',
  'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
  'DROP', 'INDEX', 'VIEW', 'WITH', 'RECURSIVE', 'EXISTS', 'ANY',
  'COALESCE', 'NULLIF', 'CAST', 'OVER', 'PARTITION', 'ROW_NUMBER',
  'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
  'DATE_TRUNC', 'EXTRACT', 'INTERVAL', 'ASC', 'DESC',
]);

// Python/pandas keywords that the user needs to recall
const PYTHON_KEYWORDS = new Set([
  'import', 'from', 'as', 'def', 'return', 'if', 'else', 'elif',
  'for', 'in', 'while', 'break', 'continue', 'pass', 'class',
  'try', 'except', 'finally', 'with', 'lambda', 'and', 'or', 'not',
  'True', 'False', 'None', 'print', 'len', 'range', 'list', 'dict',
  'set', 'tuple', 'str', 'int', 'float', 'bool', 'type',
  // pandas-specific
  'pd', 'df', 'read_csv', 'read_sql', 'read_excel',
  'groupby', 'agg', 'merge', 'concat', 'pivot_table',
  'fillna', 'dropna', 'sort_values', 'reset_index', 'set_index',
  'apply', 'map', 'value_counts', 'describe', 'head', 'tail',
  'iloc', 'loc', 'rolling', 'mean', 'sum', 'count', 'std',
  'plot', 'figure', 'subplot', 'show', 'xlabel', 'ylabel', 'title',
  // matplotlib/seaborn
  'plt', 'sns', 'matplotlib', 'pyplot', 'seaborn',
]);

function getKeywords(language: Language): Set<string> {
  return language === 'sql' ? SQL_KEYWORDS : PYTHON_KEYWORDS;
}

export function tokenize(answer: string, language: Language): Token[] {
  const keywords = getKeywords(language);
  const tokens: Token[] = [];
  let keywordIndex = 0;

  // Split by whitespace but preserve structure
  const parts = answer.split(/(\s+)/);

  for (const part of parts) {
    if (part.trim() === '') continue;

    // Check for compound tokens like "ORDER BY" already split
    const upperPart = part.toUpperCase();

    // Check if this is a keyword (case-insensitive for SQL, case-sensitive for Python)
    const isKw = language === 'sql'
      ? keywords.has(upperPart)
      : keywords.has(part);

    tokens.push({
      text: part,
      isKeyword: isKw,
      index: tokens.length,
      keywordIndex: isKw ? keywordIndex++ : undefined,
    });
  }

  return tokens;
}

export function createQuestion(
  id: string,
  prompt: string,
  answer: string,
  language: Language,
  difficultyTags: string[] = []
): Question {
  const tokens = tokenize(answer, language);
  const keywords = tokens.filter(t => t.isKeyword).map(t => t.text);
  const nonKeywords = tokens.filter(t => !t.isKeyword).map(t => t.text);

  return {
    id,
    prompt,
    language,
    answer,
    keywords,
    nonKeywords,
    tokens,
    difficulty_tags: difficultyTags,
  };
}

// Generate the display text for a token based on the level and reveal state
export function getTokenDisplay(
  token: Token,
  level: 1 | 2 | 3,
  isRevealed: boolean
): string {
  if (isRevealed || !token.isKeyword) {
    return token.text;
  }

  const word = token.text;

  switch (level) {
    case 1: // Half visible: show every other letter
      return word
        .split('')
        .map((char, i) => (i % 2 === 0 ? char : '_'))
        .join('');

    case 2: // First letter only: show first letter + underscores
      return word[0] + '_'.repeat(word.length - 1);

    case 3: // Full recall: all underscores
      return '_'.repeat(word.length);
  }
}

// Check if the user's input matches the expected keyword
export function checkInput(input: string, expected: string, level: 1 | 2 | 3): boolean {
  if (level === 3) {
    // Full recall: must type the whole word (case-insensitive for SQL)
    return input.toLowerCase() === expected.toLowerCase();
  }

  // Level 1 & 2: first letter match (case-insensitive)
  return input.toLowerCase() === expected[0].toLowerCase();
}
