// Rules:
// 10 or 11 chars
// 11 chars only starting 7
//
// Valid phones:
//   9265772603
//  79265772603

export const isValidPhone = (phone) => {
  if (!phone) return false

  const str = phone.toString(10)

  const isLol = [
    '1111111',
    '2222222',
    '3333333',
    '4444444',
    '5555555',
    '6666666',
    '7777777',
    '8888888',
    '9999999',
    '0000000',
  ].some((num) => {
    return str.includes(num)
  })

  if (isLol) return false

  if (str.length === 10) {
    return true
  }

  if (str.length === 11 && (str[0] === '7' || str[0] === '8')) {
    return true
  }

  return false
}
