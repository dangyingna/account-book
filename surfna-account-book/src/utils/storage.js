export function loadStorage(key, defaultValue) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? defaultValue : JSON.parse(value)
  } catch {
    return defaultValue
  }
}

export function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key) {
  localStorage.removeItem(key)
}
