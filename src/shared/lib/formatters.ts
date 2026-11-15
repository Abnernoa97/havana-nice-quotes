// Formateadores puros. Conservan el resultado original del diseñador.
export const usd = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
export const dDate = (str: string | null | undefined) =>
  str
    ? new Date(str + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date to be confirmed';
