
export const formatCoins = (amount: number): string => {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000) {
    const millions = absAmount / 1000000;
    if (millions >= 100) {
      return `${Math.floor(millions)}M coins`;
    } else if (millions >= 10) {
      return `${millions.toFixed(1)}M coins`;
    } else {
      return `${millions.toFixed(2)}M coins`.replace(/\.?0+/, '');
    }
  } else if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    if (thousands >= 100) {
      return `${Math.floor(thousands)}k coins`;
    } else if (thousands >= 10) {
      return `${thousands.toFixed(1)}k coins`;
    } else {
      return `${thousands.toFixed(2)}k coins`.replace(/\.?0+/, '');
    }
  } else {
    return `${absAmount.toLocaleString()} coins`;
  }
};
