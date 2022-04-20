export const getFixedDate = () => {
  const fixedAt = new Date()

  if (fixedAt.getMinutes() > 30) {
    fixedAt.setHours(fixedAt.getHours() + 1)
  }

  fixedAt.setMinutes(0)
  fixedAt.setSeconds(0)
  fixedAt.setMilliseconds(0)

  return fixedAt
}
