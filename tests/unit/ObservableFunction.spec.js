import Vue from 'vue'
import ObservableFunction from '@/ObservableFunction'

describe('ObservableFunction', () => {
  let fn
  beforeEach(() => {
    fn = new ObservableFunction(id => id)
  })

  it('is callable', () => {
    expect(typeof fn).toBe('function')
    expect(fn).not.toThrow()
  })

  describe('returns promise', () => {
    it('resolving with function return', async () => {
      await expect(fn(1)).resolves.toBe(1)
      await expect(fn(2)).resolves.toBe(2)
    })

    it('rejects with thrown error', async () => {
      const fn = new ObservableFunction(() => { throw new Error('test') })
      await expect(fn()).rejects.toThrow('test')
    })
  })

  describe('isPending', () => {
    it('has prop with default false', () => {
      expect(fn.isPending).toBe(false)
    })

    it('is true while async function is pending', async () => {
      expect.assertions(3)
      expect(fn.isPending).toBe(false)
      const p = fn(new Promise((resolve) => resolve()))
      expect(fn.isPending).toBe(true)
      await p
      expect(fn.isPending).toBe(false)
    })

    it('is false when async function is rejected', async () => {
      expect.assertions(3)
      expect(fn.isPending).toBe(false)
      const p = fn(new Promise((resolve, reject) => reject(new Error())))
      expect(fn.isPending).toBe(true)
      try {
        await p
      } catch {
        expect(fn.isPending).toBe(false)
      }
    })
  })

  describe('nPending', () => {
    it('has prop with default 0', () => {
      expect(fn.nPending).toBe(0)
    })

    it('corresponds to number of async functions pending', async () => {
      expect.assertions(4)
      expect(fn.nPending).toBe(0)
      const p1 = fn(new Promise((resolve) => resolve()))
      expect(fn.nPending).toBe(1)
      const p2 = fn(new Promise((resolve) => resolve()))
      expect(fn.nPending).toBe(2)
      await p1
      // not possible to properly test the (1) case between those two, because both promises are resolved together
      // expect(fn.nPending).toBe(1)
      await p2
      expect(fn.nPending).toBe(0)
    })
  })

  describe('error handling', () => {
    it('has "hasError" prop with default false', () => {
      expect(fn.hasError).toBe(false)
    })

    it('"hasError" is false when async function is resolved', async () => {
      expect.assertions(3)
      expect(fn.hasError).toBe(false)
      const p = fn(new Promise((resolve) => resolve()))
      expect(fn.hasError).toBe(false)
      await p
      expect(fn.hasError).toBe(false)
    })

    it('"hasError" is true when async function is rejected', async () => {
      expect.assertions(4)
      expect(fn.hasError).toBe(false)
      const p = fn(new Promise((resolve, reject) => reject(new Error('test'))))
      expect(fn.hasError).toBe(false)
      try {
        await p
      } catch {
        expect(fn.hasError).toBe(true)
        expect(fn.errors).toEqual([Error('test')])
      }
    })

    it('"errors" is array of multiple rejections', async () => {
      expect.assertions(3)
      expect(fn.errors).toEqual([])
      const p1 = fn(new Promise((resolve, reject) => reject(new Error('test'))))
      const p2 = fn(new Promise((resolve, reject) => reject(new Error('test2'))))
      expect(fn.errors).toEqual([])
      try {
        await p1
      } catch {
        try {
          await p2
        } catch {
          expect(fn.errors).toEqual([Error('test'), Error('test2')])
        }
      }
    })

    it('errors are cleared after one resolved call', async () => {
      expect.assertions(8)
      expect(fn.errors).toEqual([])
      expect(fn.hasError).toBe(false)
      const p1 = fn(new Promise((resolve, reject) => reject(new Error('test'))))
      const p2 = fn(new Promise((resolve, reject) => reject(new Error('test2'))))
      expect(fn.errors).toEqual([])
      expect(fn.hasError).toBe(false)
      try {
        await p1
      } catch {
        try {
          await p2
        } catch {
          expect(fn.errors).toEqual([Error('test'), Error('test2')])
          expect(fn.hasError).toBe(true)
        }
      }
      const p3 = fn(new Promise((resolve) => resolve()))
      await p3
      expect(fn.errors).toEqual([])
      expect(fn.hasError).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('props are reactive', async () => {
      expect.assertions(4)
      const vueInstance = new Vue({ data: () => ({ fn }) })
      const unwatchIsPending = vueInstance.$watch('fn.isPending', (isPending) => {
        expect(isPending).toBe(true)
        unwatchIsPending()
      })
      const unwatchNPending = vueInstance.$watch('fn.nPending', (nPending) => {
        expect(nPending).toBe(1)
        unwatchNPending()
      })
      const unwatchHasError = vueInstance.$watch('fn.hasError', (hasError) => {
        expect(hasError).toBe(true)
        unwatchHasError()
      })
      const unwatchErrors = vueInstance.$watch('fn.errors', (errors) => {
        expect(errors).toEqual([Error('test')])
        unwatchErrors()
      })
      const p = fn(new Promise((resolve, reject) => reject(new Error('test'))))
      try {
        await p
      } catch {}
    })
  })
})
