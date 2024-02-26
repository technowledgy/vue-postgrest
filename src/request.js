import Query from '@/Query'
import { throwWhenStatusNotOk } from '@/errors'

let defaultHeaders

export function setDefaultHeaders (headers) {
  defaultHeaders = new Headers(headers)
}

const acceptHeaderMap = {
  '': 'application/json',
  single: 'application/vnd.pgrst.object+json',
  binary: 'application/octet-stream',
  text: 'text/plain'
}

async function request (apiRoot, token, route, method, query = {}, options = {}, body) {
  const headers = new Headers(defaultHeaders)

  const isJSONBody = !([
    Blob,
    FormData,
    URLSearchParams,
    // should implement ReadableStream here, but does not exist in node, so throws in tests
    ArrayBuffer,
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    DataView,
    String,
    undefined
  ].includes(body?.constructor))

  if (isJSONBody) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Accept', acceptHeaderMap[options.accept ?? ''] || options.accept)

  if (options.limit === 0) {
    // this will be an unsatisfiable range, but the user wanted it!
    headers.set('Range-Unit', 'items')
    headers.set('Range', '-0')
  } else if (options.limit || options.offset !== undefined) {
    const lower = options.offset ?? 0
    const upper = options.limit ? lower + options.limit - 1 : ''
    headers.set('Range-Unit', 'items')
    headers.set('Range', [lower, upper].join('-'))
  }

  const prefer = ['return', 'count', 'params', 'resolution']
    .filter(key => options[key])
    .map(key => `${key}=${options[key]}`)
    .join(',')
  if (prefer) {
    headers.set('Prefer', prefer)
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // overwrite headers with custom headers if set
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers.set(k, v)
    }
  }

  const url = new Query(apiRoot, route, query)

  // send all body types the fetch api recognizes as described here https://developer.mozilla.org/de/docs/Web/API/WindowOrWorkerGlobalScope/fetch as-is, stringify the rest
  return await fetch(url.toString(), {
    method,
    headers,
    body: isJSONBody ? JSON.stringify(body) : body,
    signal: options.signal
  }).then(throwWhenStatusNotOk)
}

export default request
