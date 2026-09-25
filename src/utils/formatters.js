/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats a Date or Timestamp into Spanish locale string
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return 'Fecha desconocida';

  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns color and label for risk level
 */
export function getRiskLevelInfo(level) {
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'crítico':
      return { label: 'Crítico', color: 'error' };
    case 'high':
    case 'alto':
      return { label: 'Alto', color: 'warning' };
    case 'moderate':
    case 'moderado':
      return { label: 'Moderado', color: 'info' };
    default:
      return { label: 'Bajo', color: 'success' };
  }
}
