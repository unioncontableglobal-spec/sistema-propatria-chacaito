export function formatBs(monto: number): string {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(monto).replace('VES', 'Bs.');
}

export function formatUsd(monto: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monto);
}
