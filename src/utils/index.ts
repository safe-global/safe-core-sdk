export const sameString = (str1?: string, str2?: string): boolean => {
  if (!str1 || !str2) {
    return false
  }
  return str1.toLowerCase() === str2.toLowerCase()
}
