export function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function formatDistance(meters: number): string {
  const kilometers = meters / 1000;
  return `${kilometers.toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} km`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
