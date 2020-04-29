import { enableFetchMocks } from 'jest-fetch-mock'
import pgrstMock from './fetch.mock.js'
enableFetchMocks()
fetch.mockResponse(pgrstMock)

// only mock global Vue instance for one test file
if (window.jasmine.testPath.includes('PluginGlobalVue.spec.js')) {
  Object.defineProperty(window, 'Vue', {
    writable: true,
    value: {
      use: jest.fn()
    }
  })
}
