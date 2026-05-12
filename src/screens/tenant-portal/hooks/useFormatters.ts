export const useFormatters = () => {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return { formatDate, formatAmount };
};
