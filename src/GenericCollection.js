import GenericModel from '@/GenericModel'
import { createPKQuery, mapAliasesFromSelect } from '@/utils'
import ObservableFunction from '@/ObservableFunction'

class GenericCollection extends Array {
  #options
  #proxy
  #range = {}

  constructor (options, ...models) {
    super()
    this.#options = options

    this.#proxy = new Proxy(this, {
      defineProperty: (target, propertyKey, attributes) => {
        if (['$get', '$new'].includes(propertyKey)) return false
        return Reflect.defineProperty(target, propertyKey, attributes)
      },
      deleteProperty: (target, propertyKey) => {
        if (['$get', '$new'].includes(propertyKey)) return false
        return Reflect.deleteProperty(target, propertyKey)
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === '$get') {
          return Reflect.get(target, propertyKey, receiver).bind(this, receiver)
        }
        if (propertyKey === '$range') return this.#range
        return Reflect.get(target, propertyKey, receiver)
      },
      getOwnPropertyDescriptor: (target, propertyKey) => {
        if (['$get', '$new'].includes(propertyKey)) return undefined
        return Reflect.getOwnPropertyDescriptor(target, propertyKey)
      },
      has: (target, propertyKey) => {
        return Reflect.has(this, propertyKey)
      },
      set: (target, propertyKey, value, receiver) => {
        if (propertyKey === 'length') return Reflect.set(target, propertyKey, value, receiver)

        if (typeof value !== 'object' || !value) {
          throw new Error('Can only add objects to GenericCollection')
        }

        return Reflect.set(
          target,
          propertyKey,
          new GenericModel(
            {
              route: this.#options.route,
              select: this.#options.query?.select,
              query: createPKQuery(this.#options.route.pks, mapAliasesFromSelect(this.#options.query?.select, value))
            },
            value
          ),
          receiver
        )
      }
    })

    // add seed models through proxy
    this.#proxy.push(...models)

    return this.#proxy
  }

  map (...args) {
    return Array.from(this).map(...args)
  }

  $get = new ObservableFunction(async (receiver, signal, opts = {}) => {
    await this.#options.route.$ready
    // remove accept and route from options, to prevent overriding it
    const { accept, route, query = {}, ...options } = Object.assign({}, this.#options, opts)

    const resp = await this.#options.route.get(query, { ...options, signal })

    if (resp.headers.get('Content-Range')) {
      const [bounds, total] = resp.headers.get('Content-Range').split('/')
      const [first, last] = bounds.split('-')
      this.#range = {
        totalCount: total === '*' ? undefined : parseInt(total, 10),
        first: parseInt(first, 10),
        last: isNaN(parseInt(last, 10)) ? undefined : parseInt(last, 10)
      }
    }

    const body = await resp.json()

    // TODO: Make this model.setData for existing by using a PK map
    receiver.length = 0
    receiver.push(...body)
    return body
  })

  $new (data) {
    const newIndex = this.push(data) - 1
    return this[newIndex]
  }
}

export default GenericCollection
