let defaultHeaders

export function setDefaultHeaders (headers) {
  defaultHeaders = new Headers(headers)
}

export function getDefaultHeaders () {
  return defaultHeaders
}
