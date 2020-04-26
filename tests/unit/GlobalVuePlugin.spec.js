import PostgrestPlugin from '@/index'

describe('Global Vue', () => {
  it('makes plugin register itself', () => {
    expect(global.Vue.use).toHaveBeenCalledWith(PostgrestPlugin)
  })
})
