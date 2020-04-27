import request from '@/request'

const mockData = [
  {
    id: 1,
    name: 'Test Client 1'
  },
  {
    id: 2,
    name: 'Test Client 2'
  },
  {
    id: 3,
    name: 'Test Client 3'
  }
]

fetch.mockResponse(async req => {
  if (req.url === 'http://localhost/api') {
    return {
      body: JSON.stringify({
        definitions: {
          clients: {
            properties: {
              id: {
                type: 'integer',
                description: 'Note:\nThis is a Primary Key.<pk/>'
              }
            }
          }
        }
      }),
      init: {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/openapi+json'
        }
      }
    }
  } else {
    return {
      body: JSON.stringify(mockData),
      init: {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  }
})

describe('Request', () => {
  beforeEach(() => {
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  it('sends a request with the specified method', async () => {
    expect.assertions(4)
    await request('/api', '', 'clients', 'GET', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'GET').length).toBe(1)

    await request('/api', '', 'clients', 'POST', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'POST').length).toBe(1)

    await request('/api', '', 'clients', 'DELETE', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'DELETE').length).toBe(1)

    await request('/api', '', 'clients', 'PATCH', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'PATCH').length).toBe(1)
  })

  it('it sends passed select part of query', async () => {
    await request('/api', '', 'clients', 'GET', { select: ['id', 'name'] })
    expect(decodeURIComponent(fetch.mock.calls[0][0])).toBe('http://localhost/api/clients?select=id,name')
  })

  it('it parses "accept" option correctly', async () => {
    await request('/api', '', 'clients', 'GET', {}, { accept: 'single' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/vnd.pgrst.object+json')
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { accept: 'binary' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/octet-stream')
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { accept: undefined })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/json')
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { accept: 'custom-accept-header' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('custom-accept-header')
  })

  it('it parses "return" option correctly', async () => {
    await request('/api', '', 'clients', 'GET', {}, {})
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe(null)
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { return: 'representation' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('return=representation')
  })

  it('it parses "count" option correctly', async () => {
    await request('/api', '', 'clients', 'GET', {}, {})
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe(null)
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { count: 'exact' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('count=exact')
  })

  it('it parses "params" option correctly', async () => {
    await request('/api', '', 'clients', 'GET', {}, {})
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe(null)
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { params: 'single-object' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('params=single-object')
    fetch.mockClear()

    await request('/api', '', 'clients', 'GET', {}, { params: 'multiple-objects' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('params=multiple-objects')
  })

  it('it parses "headers" option correctly', async () => {
    const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }

    await request('/api', '', 'clients', 'GET', {}, { headers })
    const getHeaders = fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers
    expect(getHeaders.get('Prefer')).toBe(headers.prefer)
    expect(getHeaders.get('Accept')).toBe(headers.accept)
    expect(getHeaders.get('X-Header')).toBe(headers['x-header'])
    fetch.mockClear()

    await request('/api', '', 'clients', 'POST', {}, { accept: 'binary', return: 'minimal', headers })
    const postHeaders = fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers
    expect(postHeaders.get('Prefer')).toBe(headers.prefer)
    expect(postHeaders.get('Accept')).toBe(headers.accept)
    expect(postHeaders.get('X-Header')).toBe(headers['x-header'])
  })

  it('it combines return and count options correctly', async () => {
    await request('/api', '', 'clients', 'POST', {}, { count: 'exact', return: 'minimal' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('return=minimal,count=exact')
  })

  it('does not throw if query argument is undefined', async () => {
    expect.assertions(1)
    await expect(request('/api', '', 'clients', 'GET')).resolves.toBeTruthy()
  })

  it('does not send authorization header if prop "token" is not set', async () => {
    expect.assertions(1)
    await request('/api', '', 'clients', 'GET', {})
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
  })

  it('sends authorization header if argument "token" is set', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    expect.assertions(1)
    await request('/api', token, 'clients', 'GET', {})
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
  })
})
