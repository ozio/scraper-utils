const regex = /(\b(https?|ftp|file|tg|viber|whatsapp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi

export const findURLsInString = (string) => {
  return [...(string.match(regex) || [])]
}
