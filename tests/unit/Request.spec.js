import request from '@/request'
import GenericModel from '@/GenericModel'

describe('request method', () => {
  beforeEach(() => {
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  it('sends a request with method GET, POST, PUT, PATCH or DELETE', async () => {
    await request('/api', '', 'clients', 'GET', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      method: 'GET'
    }))

    await request('/api', '', 'clients', 'POST', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      method: 'POST'
    }))

    await request('/api', '', 'clients', 'PUT', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      method: 'PUT'
    }))

    await request('/api', '', 'clients', 'PATCH', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      method: 'PATCH'
    }))

    await request('/api', '', 'clients', 'DELETE', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      method: 'DELETE'
    }))
  })

  it('does not throw if query argument is undefined', async () => {
    await expect(request('/api', '', 'clients', 'GET')).resolves.toBeTruthy()
  })

  it('appends query to URL', async () => {
    await request('/api', '', 'clients', 'GET', { select: ['id', 'name'] })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients?select=' + encodeURIComponent('id,name'), expect.anything())

    await request('/api', '', 'clients', 'POST', { 'id.eq': 1 })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients?id=' + encodeURIComponent('eq.1'), expect.anything())

    await request('/api', '', 'clients', 'PATCH', { order: 'name.asc' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients?order=' + encodeURIComponent('name.asc'), expect.anything())

    await request('/api', '', 'clients', 'DELETE', { limit: 1, offset: 2 })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients?limit=1&offset=2', expect.anything())
  })

  it('parses "accept" option', async () => {
    await request('/api', '', 'clients', 'GET', {}, { accept: 'single' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/vnd.pgrst.object+json'
      })
    }))

    await request('/api', '', 'clients', 'POST', {}, { accept: 'binary' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/octet-stream'
      })
    }))

    await request('/api', '', 'clients', 'POST', {}, { accept: 'text' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'text/plain'
      })
    }))

    await request('/api', '', 'clients', 'PATCH', {}, { accept: undefined })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json'
      })
    }))

    await request('/api', '', 'clients', 'DELETE', {}, { accept: 'custom-accept-header' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'custom-accept-header'
      })
    }))
  })

  describe('set range headers for "offset" and "limit" options', () => {
    it('offset 0', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 0 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '0-'
        })
      }))
    })

    it('offset 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 1 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '1-'
        })
      }))
    })

    it('offset > 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 5 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '5-'
        })
      }))
    })

    it('limit 0', async () => {
      await request('/api', '', 'clients', 'GET', {}, { limit: 0 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '-0'
        })
      }))
    })

    it('limit 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { limit: 1 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '0-0'
        })
      }))
    })

    it('limit > 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { limit: 10 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '0-9'
        })
      }))
    })

    it('offset > 0 and limit 0', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 5, limit: 0 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '-0'
        })
      }))
    })

    it('offset > 0 and limit 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 5, limit: 1 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '5-5'
        })
      }))
    })

    it('offset > 0 and limit > 1', async () => {
      await request('/api', '', 'clients', 'GET', {}, { offset: 5, limit: 10 })
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Range-Unit': 'items',
          Range: '5-14'
        })
      }))
    })
  })

  it('parses "return" option', async () => {
    await request('/api', '', 'clients', 'POST', {}, { return: 'representation' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'return=representation'
      })
    }))
  })

  it('parses "count" option', async () => {
    await request('/api', '', 'clients', 'GET', {}, { count: 'exact' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'count=exact'
      })
    }))
  })

  it('parses "params" option', async () => {
    await request('/api', '', 'clients', 'POST', {}, { params: 'single-object' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'params=single-object'
      })
    }))

    await request('/api', '', 'clients', 'POST', {}, { params: 'multiple-objects' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'params=multiple-objects'
      })
    }))
  })

  it('parses "resolution" option', async () => {
    await request('/api', '', 'clients', 'POST', {}, { resolution: 'merge-duplicates' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'resolution=merge-duplicates'
      })
    }))

    await request('/api', '', 'clients', 'POST', {}, { resolution: 'ignore-duplicates' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'resolution=ignore-duplicates'
      })
    }))
  })

  it('combines multiple prefer options', async () => {
    await request('/api', '', 'clients', 'PATCH', {}, { count: 'exact', return: 'minimal' })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'return=minimal,count=exact'
      })
    }))
  })

  it('passes "headers" option as override', async () => {
    const headers = {
      Prefer: 'custom-prefer-header',
      Accept: 'custom-accept-header',
      'x-header': 'custom-x-header'
    }

    await request('/api', '', 'clients', 'GET', {}, { headers })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers(headers)
    }))

    await request('/api', '', 'clients', 'POST', {}, { accept: 'binary', return: 'minimal', headers })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers(headers)
    }))
  })

  it('passes "signal" option to fetch', async () => {
    const controller = new AbortController()
    const signal = controller.signal
    await request('/api', '', 'clients', 'GET', {}, { signal })
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      signal
    }))
  })

  it('sends authorization header if argument "token" is set', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    await request('/api', token, 'clients', 'GET', {})
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
      headers: new Headers({
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      })
    }))
  })

  describe('body argument', () => {
    it('is stringified when plain object and sets content-type header to application/json', async () => {
      const body = {
        string: 'value',
        number: 5
      }
      await request('/api', '', 'clients', 'POST', {}, {}, body)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body)
      }))
    })

    it('is stringified when generic model and sets content-type header to application/json', async () => {
      const body = new GenericModel({}, {
        string: 'value', number: 5
      })
      await request('/api', '', 'clients', 'POST', {}, {}, body)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        headers: new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body)
      }))
    })

    it('is sent as-is when blob', async () => {
      const body = new Blob()
      await request('/api', '', 'clients', 'POST', {}, {}, body)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        body: body
      }))
    })

    it('is sent as-is when form data', async () => {
      const body = new FormData()
      await request('/api', '', 'clients', 'POST', {}, {}, body)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        body: body
      }))
    })

    it('is sent as-is when string', async () => {
      const body = 'value'
      await request('/api', '', 'clients', 'POST', {}, {}, body)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
        body: 'value'
      }))
    })
  })
})
