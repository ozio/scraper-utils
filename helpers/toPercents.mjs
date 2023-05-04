export const toPercents = (all, partial) => {
  return Math.round((partial / all) * 1000) / 10
}
