import Schema from '@/Schema'

import request from '@/request'
jest.mock('@/request')

describe('Route', () => {
  const schema = new Schema('/api')
  const route = schema.$route('clients')
  beforeAll(() => route.$ready)

  beforeEach(() => {
    request.mockClear()
  })

  it('has proper primary keys set', async () => {
    const schema = new Schema('/pk-api')
    await schema.$ready
    expect(fetch).toHaveBeenLastCalledWith('http://localhost/pk-api', expect.anything())

    const no = schema.$route('no_pk')
    expect(no.pks).toEqual([])

    const simple = schema.$route('simple_pk')
    expect(simple.pks).toEqual(['id'])

    const composite = schema.$route('composite_pk')
    expect(composite.pks).toEqual(['id', 'name'])
  })

  describe('request methods', () => {
    it('has properly curried request method without token', () => {
      route()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients')
    })

    it('has properly curried request method with token', async () => {
      const routeWithToken = schema('/api', 'test-token').$route('clients')
      routeWithToken()
      expect(request).toHaveBeenCalledWith('/api', 'test-token', 'clients')
    })

    it('has properly curried request methods for OPTIONS, GET, HEAD, POST, PUT, PATCH and DELETE', () => {
      route.options()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'OPTIONS')
      route.get()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'GET')
      route.head()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'HEAD')
      route.post()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'POST')
      route.put()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'PUT')
      route.patch()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'PATCH')
      route.delete()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'DELETE')
    })
  })
})
