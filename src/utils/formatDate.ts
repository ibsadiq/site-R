// utils/formatDate.ts
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
