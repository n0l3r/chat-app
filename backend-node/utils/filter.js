// Word filter for censoring bad words
const badWords = [
  // Indonesian
  'anjing', 'bangsat', 'babi', 'kontol', 'memek', 'pepek', 'ngentot', 'ngewe',
  'tolol', 'bodoh', 'goblok', 'tai', 'setan', 'kampret', 'bajingan', 'sialan',
  'brengsek', 'jancok', 'jembut', 'kimak', 'pukimak', 'pantek', 'peler',
  
  // English  
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'hell',
  'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag', 'nigger', 'whore',
  'slut', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'boobs', 'sex'
];

function censorMessage(text) {
  let censored = text;
  
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = '*'.repeat(word.length);
    censored = censored.replace(regex, replacement);
  });
  
  // Also censor variations with numbers/symbols
  censored = censored.replace(/k[0o]nt[0o]l/gi, (match) => '*'.repeat(match.length));
  censored = censored.replace(/[4@]nj[1i]ng/gi, (match) => '*'.repeat(match.length));
  censored = censored.replace(/b[4@]ng[5s][4@]t/gi, (match) => '*'.repeat(match.length));
  censored = censored.replace(/f[*\-_]?u[*\-_]?c[*\-_]?k/gi, (match) => '*'.repeat(match.length));
  censored = censored.replace(/[5s]h[1i]t/gi, (match) => '*'.repeat(match.length));
  
  return censored;
}

module.exports = { censorMessage };