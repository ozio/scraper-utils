export const switchKeyValue = (map) => {
  return new Map(
    Array.from(map.entries())
      .map(([key, value]) => [value, key])
  )
}
