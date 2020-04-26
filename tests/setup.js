import { enableFetchMocks } from 'jest-fetch-mock'
enableFetchMocks()

// only mock global Vue instance for one test file
if (window.jasmine.testPath.includes('GlobalVuePlugin.spec.js')) {
  Object.defineProperty(window, 'Vue', {
    writable: true,
    value: {
      use: jest.fn()
    }
  })
}
