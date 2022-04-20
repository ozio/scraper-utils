export const formatPhone = (int) => {
  const s = int.toString()

  return `+7 (${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6, 8)}-${s.slice(8, 10)}`
}
