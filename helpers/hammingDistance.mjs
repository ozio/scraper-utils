export const hammingDistance = (str1 = '', str2 = '', maxDistance = str1.length) => {
  if (str1.length !== str2.length) {
    return null
  }

  let dist = 0

  for (let i = 0; i < str1.length; i += 1) {
    if (str1[i] !== str2[i]) {
      dist += 1

      if (dist > maxDistance) {
        return dist
      }
    }
  }

  return dist
}
