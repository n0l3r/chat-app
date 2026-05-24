const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/bad-words.json');

const defaultBadWords = [
  // Indonesian
  'anjing', 'bangsat', 'babi', 'kontol', 'memek', 'pepek', 'ngentot', 'ngewe',
  'tolol', 'bodoh', 'goblok', 'tai', 'setan', 'kampret', 'bajingan', 'sialan',
  'brengsek', 'jancok', 'jembut', 'kimak', 'pukimak', 'pantek', 'peler',

  // English
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'hell',
  'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag', 'nigger', 'whore',
  'slut', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'boobs', 'sex'
];

function loadWords() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[filter] Failed to load bad-words.json, using defaults:', e.message);
  }
  return [...defaultBadWords];
}

function saveWords(words) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(words, null, 2), 'utf8');
  } catch (e) {
    console.error('[filter] Failed to save bad-words.json:', e.message);
  }
}

let badWords = loadWords();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addWord(word) {
  const w = word.toLowerCase().trim();
  if (w && !badWords.includes(w)) {
    badWords.push(w);
    saveWords(badWords);
    return true;
  }
  return false;
}

function removeWord(word) {
  const w = word.toLowerCase().trim();
  const idx = badWords.indexOf(w);
  if (idx !== -1) {
    badWords.splice(idx, 1);
    saveWords(badWords);
    return true;
  }
  return false;
}

function getWords() {
  return [...badWords];
}

function censorMessage(text) {
  let censored = text;

  badWords.forEach(word => {
    const regex = new RegExp(escapeRegex(word), 'gi');
    censored = censored.replace(regex, (match) => '*'.repeat(match.length));
  });

  censored = censored.replace(/k[0o]nt[0o]l/gi, (m) => '*'.repeat(m.length));
  censored = censored.replace(/[4@]nj[1i]ng/gi, (m) => '*'.repeat(m.length));
  censored = censored.replace(/b[4@]ng[5s][4@]t/gi, (m) => '*'.repeat(m.length));
  censored = censored.replace(/f[*\-_]?u[*\-_]?c[*\-_]?k/gi, (m) => '*'.repeat(m.length));
  censored = censored.replace(/[5s]h[1i]t/gi, (m) => '*'.repeat(m.length));

  return censored;
}

module.exports = { censorMessage, addWord, removeWord, getWords };
