import RPC from '@/RPC'

const request = jest.fn(() => 'returned content')

describe('RPC', () => {
  const rpc = new RPC(request)

  beforeEach(() => {
    request.mockClear()
  })

  it('sends a request with POST and GET', async () => {
    await rpc('rpc-test', { get: false }, { a: 1, b: 2 })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'POST', undefined, {}, { a: 1, b: 2 })
    await rpc('rpc-test', { get: true }, { a: 1, b: 2 })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'GET', { a: 1, b: 2 }, {})
  })

  it('does not send arguments when not specified', async () => {
    await rpc('rpc-test', { get: false })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'POST', undefined, {}, undefined)
    await rpc('rpc-test', { get: true })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'GET', {}, {})
  })

  it('defaults to POST', async () => {
    await rpc('rpc-test')
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'POST', undefined, {}, undefined)
  })

  it('passes options to request properly', async () => {
    await rpc('rpc-test', {
      get: false,
      query: { select: 'id' },
      accept: 'binary',
      headers: { 'x-header': 'custom-x-header' }
    }, { a: 1, b: 2 })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'POST', { select: 'id' }, {
      accept: 'binary',
      headers: { 'x-header': 'custom-x-header' }
    }, { a: 1, b: 2 })

    await rpc('rpc-test', {
      get: true,
      query: { select: 'id' },
      accept: 'binary',
      headers: { 'x-header': 'custom-x-header' }
    }, { a: 1, b: 2 })
    expect(request).toHaveBeenLastCalledWith('rpc/rpc-test', 'GET', { a: 1, b: 2, select: 'id' }, {
      accept: 'binary',
      headers: { 'x-header': 'custom-x-header' }
    })
  })

  it('returns request result', async () => {
    await expect(rpc('rpc-test')).resolves.toBe('returned content')
    await expect(rpc('rpc-test', { get: true })).resolves.toBe('returned content')
  })
})
