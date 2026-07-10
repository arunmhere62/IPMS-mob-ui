export const formatCurrency = (amount: string | number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  const value = Number(amount);
  if (Number.isNaN(value)) return 'N/A';
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
