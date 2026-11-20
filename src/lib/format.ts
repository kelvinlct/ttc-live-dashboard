const toronto = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatToronto(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return toronto.format(date);
}

export function formatAlertWindow(start: string | null, end: string | null): string {
  if (start && end) return `${formatToronto(start)} – ${formatToronto(end)}`;
  if (start) return `Since ${formatToronto(start)}`;
  if (end) return `Until ${formatToronto(end)}`;
  return "";
}

export function destinationOf(directionTitle: string): string {
  const marker = "towards";
  const index = directionTitle.toLowerCase().indexOf(marker);
  if (index === -1) return directionTitle;
  const destination = directionTitle.slice(index + marker.length).trim();
  return destination || directionTitle;
}

export function minuteLabel(minutes: number): string {
  if (minutes <= 0) return "Due";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}
