const COLUMNS = [
  'dataSource',
  'sessionId',
  'elapsedMinutes',
  'avgEAR',
  'minEAR',
  'perclos',
  'blinkRate',
  'microsleeps',
  'alerts',
  'fatiguePct',
  'maxFatigue',
  'attentionScore',
  'facePresenceRatio',
  'state',
  'dataQuality',
];

function safeCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function buildAnalyticsCsv(observations = [], dataSource = 'real') {
  const rows = Array.isArray(observations) ? observations : [];
  const lines = [COLUMNS.join(',')];

  for (const observation of rows) {
    const record = { dataSource, ...observation };
    lines.push(COLUMNS.map((column) => safeCell(record[column])).join(','));
  }

  return `${lines.join('\r\n')}\r\n`;
}

export function downloadAnalyticsCsv(observations, dataSource, filename = 'somnoguard-analitica.csv') {
  const csv = buildAnalyticsCsv(observations, dataSource);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
