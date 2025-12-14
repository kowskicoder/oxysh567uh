
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  const absAmount = Math.abs(amount);
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : '€';
  
  if (absAmount >= 1000000) {
    const millions = absAmount / 1000000;
    if (millions >= 100) {
      return `${symbol}${Math.floor(millions)}M`;
    } else if (millions >= 10) {
      return `${symbol}${millions.toFixed(1)}M`;
    } else {
      return `${symbol}${millions.toFixed(2)}M`.replace(/\.?0+$/, '');
    }
  } else if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    if (thousands >= 100) {
      return `${symbol}${Math.floor(thousands)}k`;
    } else if (thousands >= 10) {
      return `${symbol}${thousands.toFixed(1)}k`;
    } else {
      return `${symbol}${thousands.toFixed(2)}k`.replace(/\.?0+$/, '');
    }
  } else {
    return `${symbol}${absAmount.toLocaleString()}`;
  }
};

export const formatBalance = (amount: number): string => {
  return formatCurrency(amount, 'NGN');
};
