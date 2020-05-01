import { enableFetchMocks } from 'jest-fetch-mock'
import postgrestMock from './fetch.mock.js'
enableFetchMocks()
fetch.mockResponse(postgrestMock)

// only mock global Vue instance for index file
if (globalThis.jasmine.testPath.includes('index.spec.js')) {
  Object.defineProperty(globalThis, 'Vue', {
    writable: true,
    value: {
      use: jest.fn()
    }
  })
}
