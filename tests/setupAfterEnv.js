import { enableFetchMocks } from 'jest-fetch-mock'
import postgrestMock from './fetch.mock.js'
enableFetchMocks()
fetch.mockResponse(postgrestMock)
