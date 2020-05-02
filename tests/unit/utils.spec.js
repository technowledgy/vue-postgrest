import { isEqual, syncObjects, splitToObject } from '@/utils'

describe('utils', () => {
  describe('isEqual', () => {
    // helper function for shorter test cases
    function itIsEqual (desc, a, b, expectedResult) {
      it(desc, () => {
        expect(isEqual(a, b)).toBe(expectedResult)
        expect(isEqual(b, a)).toBe(expectedResult)
      })
    }
    function itIsEqualCombinations (values) {
      /* eslint-disable camelcase */
      values.forEach((a, i_a) => {
        const str_a = JSON.stringify(a) === 'null' ? String(a) : JSON.stringify(a)
        values.forEach((b, i_b) => {
          const str_b = JSON.stringify(b) === 'null' ? String(b) : JSON.stringify(b)
          if (i_b >= i_a) itIsEqual(`${str_a}, ${str_b}`, a, b, i_a === i_b)
        })
      })
      /* eslint-enable camelcase */
    }

    describe('primitive values', () => {
      itIsEqualCombinations([
        undefined,
        null,
        false,
        true,
        0,
        1,
        NaN,
        3.14,
        Infinity,
        '',
        'str',
        Symbol('sym'),
        {},
        []
      ])
    })

    describe('primitives wrapped in constructors', () => {
      /* eslint-disable no-new-wrappers */
      itIsEqual('Boolean(true), true', new Boolean(true), true, true)
      itIsEqual('Boolean(true), false', new Boolean(true), false, false)
      itIsEqual('Boolean(false), true', new Boolean(false), true, false)
      itIsEqual('Boolean(false), false', new Boolean(false), false, true)
      itIsEqual('Number(0), 0', new Number(0), 0, true)
      itIsEqual('Number(0), 1', new Number(0), 1, false)
      itIsEqual('Number(1), 0', new Number(1), 0, false)
      itIsEqual('Number(1), 1', new Number(1), 1, true)
      itIsEqual('String(""), ""', new String(''), '', true)
      itIsEqual('String(""), "str"', new String(''), 'str', false)
      itIsEqual('String("str"), ""', new String('str'), '', false)
      itIsEqual('String("str"), "str"', new String('str'), 'str', true)
      /* eslint-enable no-new-wrappers */
    })

    describe('Date', () => {
      const date1 = new Date('December 17, 1995 03:24:00')
      const date2 = new Date('1995-12-17T03:24:00')
      const date3 = new Date('2000-01-01T00:00:00')
      const value1 = date1.valueOf()
      itIsEqual('same object', date1, date1, true)
      itIsEqual('same value', date1, date2, true)
      itIsEqual('different', date1, date3, false)
      itIsEqual('same value but not date', date1, value1, false)
    })

    describe('Basic Arrays and Objects', () => {
      const arr1 = ['a']
      const obj1 = { a: 'a' }
      itIsEqual('same array', arr1, arr1, true)
      itIsEqual('same object', obj1, obj1, true)
      itIsEqual('same array values', arr1, ['a'], true)
      itIsEqual('same object values', obj1, { a: 'a' }, true)
      itIsEqual('array and object with same values', arr1, { 0: 'a' }, false)
      itIsEqual('different array values', arr1, ['b'], false)
      itIsEqual('different object values', obj1, { a: 'b' }, false)
      itIsEqual('different array keys, same values', arr1, [undefined, 'a'], false)
      itIsEqual('different object keys, same values', obj1, { b: 'a' }, false)
      itIsEqual('different array keys, different values', arr1, [undefined, 'b'], false)
      itIsEqual('different object keys, different values', obj1, { b: 'b' }, false)
      itIsEqual('array missing keys', arr1, ['a', 'b'], false)
      itIsEqual('object missing keys', obj1, { a: 'a', b: 'b' }, false)
    })

    describe('Nested objects and arrays', () => {
      itIsEqual('same', {
        a: {
          b: {
            c: [{ e: 'f' }, 'g'],
            h: 'i'
          },
          j: 'k'
        },
        l: 'm'
      }, {
        a: {
          b: {
            c: [{ e: 'f' }, 'g'],
            h: 'i'
          },
          j: 'k'
        },
        l: 'm'
      }, true)
      itIsEqual('different', {
        a: {
          b: {
            c: [{ e: 'f' }, 'g'],
            h: 'i'
          },
          j: 'k'
        },
        l: 'm'
      }, {
        a: {
          b: {
            c: [{ e: 'F' }, 'g'],
            h: 'i'
          },
          j: 'k'
        },
        l: 'm'
      }, false)
    })
  })

  describe('syncObjects', () => {
    describe('del = true, default', () => {
      const obj1 = {
        del1: 'to-be-removed',
        change1: 'a',
        replace1: 'with-object',
        keep1: {
          del2: 'to-be-removed',
          change2: 'a',
          replace2: 'with-array',
          keep2: {
            del3: 'to-be-removed',
            change3: 'a',
            keep3: 'a'
          },
          keep4: [
            'a',
            'changed-to-b',
            'to-be-removed'
          ]
        },
        keep5: [
          {
            change4: 'object-to-be-changed'
          },
          {
            change5: 'object-to-be-replaced'
          },
          {
            keep6: 'object-to-be-kept'
          }
        ]
      }
      // keep references to nested objects to check if references are kept intact
      const ref1 = obj1.keep1
      const ref2 = obj1.keep1.keep2
      const ref3 = obj1.keep1.keep2.keep3
      const ref4 = obj1.keep1.keep4
      const ref5 = obj1.keep5
      const ref50 = obj1.keep5[0]
      const ref52 = obj1.keep5[2]
      const ref6 = obj1.keep5[2].keep6
      const obj2 = {
        change1: 'b',
        new1: 'new',
        replace1: { a: 'a' },
        keep1: {
          change2: 'b',
          new2: 'new',
          replace2: ['a'],
          keep2: {
            change3: 'b',
            new3: 'new',
            keep3: 'a'
          },
          keep4: [
            'a',
            'b'
          ]
        },
        keep5: [
          {
            change4: 'b',
            new4: 'new'
          },
          'replaced-with-string',
          {
            keep6: 'object-to-be-kept'
          }
        ]
      }
      const ret = syncObjects(obj1, obj2)

      it('keeps references in first object', () => {
        expect(ret).toBe(obj1)
        expect(obj1.keep1).toBe(ref1)
        expect(obj1.keep1.keep2).toBe(ref2)
        expect(obj1.keep1.keep2.keep3).toBe(ref3)
        expect(obj1.keep1.keep4).toBe(ref4)
        expect(obj1.keep5).toBe(ref5)
        expect(obj1.keep5[0]).toBe(ref50)
        expect(obj1.keep5[2]).toBe(ref52)
        expect(obj1.keep5[2].keep6).toBe(ref6)
      })

      it('deletes keys at all levels', () => {
        expect(obj1).not.toHaveProperty('del1')
        expect(obj1).not.toHaveProperty('keep1.del2')
        expect(obj1).not.toHaveProperty('keep1.keep2.del3')
        expect(obj1).not.toHaveProperty('keep1.keep4.2')
      })

      it('updates values at all levels', () => {
        expect(obj1).toHaveProperty('change1', 'b')
        expect(obj1).toHaveProperty('keep1.change2', 'b')
        expect(obj1).toHaveProperty('keep1.keep2.change3', 'b')
        expect(obj1).toHaveProperty('keep1.keep4.1', 'b')
        expect(obj1).toHaveProperty('keep5.0.change4', 'b')
      })

      it('inserts new keys at all levels', () => {
        expect(obj1).toHaveProperty('new1', 'new')
        expect(obj1).toHaveProperty('keep1.new2', 'new')
        expect(obj1).toHaveProperty('keep1.keep2.new3', 'new')
        expect(obj1).toHaveProperty('keep5.0.new4', 'new')
      })

      it('replaces strings and objects', () => {
        expect(obj1.replace1).toEqual({ a: 'a' })
        expect(obj1.keep1.replace2).toEqual(['a'])
        expect(obj1).toHaveProperty('keep5.1', 'replaced-with-string')
      })
    })

    describe('del = false', () => {
      const obj1 = {
        del1: 'not-to-be-removed',
        change1: 'a',
        replace1: 'with-object',
        keep1: {
          del2: 'to-be-removed',
          change2: 'a',
          replace2: 'with-array',
          keep2: {
            del3: 'to-be-removed',
            change3: 'a',
            keep3: 'a'
          },
          keep4: [
            'a',
            'changed-to-b',
            'to-be-removed'
          ]
        },
        keep5: [
          {
            change4: 'object-to-be-changed'
          },
          {
            change5: 'object-to-be-replaced'
          },
          {
            keep6: 'object-to-be-kept'
          }
        ]
      }
      // keep references to nested objects to check if references are kept intact
      const ref1 = obj1.keep1
      const ref2 = obj1.keep1.keep2
      const ref3 = obj1.keep1.keep2.keep3
      const ref4 = obj1.keep1.keep4
      const ref5 = obj1.keep5
      const ref50 = obj1.keep5[0]
      const ref52 = obj1.keep5[2]
      const ref6 = obj1.keep5[2].keep6
      const obj2 = {
        change1: 'b',
        new1: 'new',
        replace1: { a: 'a' },
        keep1: {
          change2: 'b',
          new2: 'new',
          replace2: ['a'],
          keep2: {
            change3: 'b',
            new3: 'new',
            keep3: 'a'
          },
          keep4: [
            'a',
            'b'
          ]
        },
        keep5: [
          {
            change4: 'b',
            new4: 'new'
          },
          'replaced-with-string',
          {
            keep6: 'object-to-be-kept'
          }
        ]
      }
      const ret = syncObjects(obj1, obj2, false)

      it('keeps references in first object', () => {
        expect(ret).toBe(obj1)
        expect(obj1.keep1).toBe(ref1)
        expect(obj1.keep1.keep2).toBe(ref2)
        expect(obj1.keep1.keep2.keep3).toBe(ref3)
        expect(obj1.keep1.keep4).toBe(ref4)
        expect(obj1.keep5).toBe(ref5)
        expect(obj1.keep5[0]).toBe(ref50)
        expect(obj1.keep5[2]).toBe(ref52)
        expect(obj1.keep5[2].keep6).toBe(ref6)
      })

      it('deletes keys at all but first levels', () => {
        expect(obj1).toHaveProperty('del1', 'not-to-be-removed')
        expect(obj1).not.toHaveProperty('keep1.del2')
        expect(obj1).not.toHaveProperty('keep1.keep2.del3')
        expect(obj1).not.toHaveProperty('keep1.keep4.2')
      })

      it('updates values at all levels', () => {
        expect(obj1).toHaveProperty('change1', 'b')
        expect(obj1).toHaveProperty('keep1.change2', 'b')
        expect(obj1).toHaveProperty('keep1.keep2.change3', 'b')
        expect(obj1).toHaveProperty('keep1.keep4.1', 'b')
        expect(obj1).toHaveProperty('keep5.0.change4', 'b')
      })

      it('inserts new keys at all levels', () => {
        expect(obj1).toHaveProperty('new1', 'new')
        expect(obj1).toHaveProperty('keep1.new2', 'new')
        expect(obj1).toHaveProperty('keep1.keep2.new3', 'new')
        expect(obj1).toHaveProperty('keep5.0.new4', 'new')
      })

      it('replaces strings and objects', () => {
        expect(obj1.replace1).toEqual({ a: 'a' })
        expect(obj1.keep1.replace2).toEqual(['a'])
        expect(obj1).toHaveProperty('keep5.1', 'replaced-with-string')
      })
    })
  })

  describe('splitToObject', () => {
    it('splits single pair', () => {
      expect(splitToObject('k=v')).toEqual({ k: 'v' })
    })

    it('splits multiple pairs', () => {
      expect(splitToObject('k1=v1,k2=v2')).toEqual({ k1: 'v1', k2: 'v2' })
    })

    it('returns undefined for field without delimiter', () => {
      expect(splitToObject('k1,k2=v2')).toEqual({ k1: undefined, k2: 'v2' })
    })

    it('removes quotes properly', () => {
      expect(splitToObject('k1="test"test"')).toEqual({ k1: 'test"test' })
    })
  })
})
