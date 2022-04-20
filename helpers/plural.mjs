export const plural = (num, one, two, five) => {
  const digits = num % 100
  const digit = digits > 10 && digits < 20 ? 5 : num % 10

  if (digit === 1) return one.replace('%', num)
  if (digit > 1 && digit < 5) return two.replace('%', num)

  return five.replace('%', num)
}
