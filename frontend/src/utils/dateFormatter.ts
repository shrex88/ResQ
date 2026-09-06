export function formatIncidentTime(timestamp?: string): string {
  if (!timestamp) return "Just now";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');

    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return timestamp;
  }
}
