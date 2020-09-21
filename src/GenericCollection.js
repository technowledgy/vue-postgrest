import GenericModel from '@/GenericModel'
import { createPKQuery, createReactivePrototype, mapAliasesFromSelect } from '@/utils'

class GenericCollection extends Array {
  #options
  #proxy
  #range = {}

  constructor (options, ...models) {
    super()
    this.#options = options

    this.#proxy = new Proxy(createReactivePrototype(this, this), {
      get: (target, property, receiver) => {
        if (property === '$range') return this.#range
        return Reflect.get(target, property, receiver)
      },
      set: (target, property, value, receiver) => {
        if (property === 'length') return Reflect.set(target, property, value, receiver)

        if (typeof value !== 'object' || !value) {
          throw new Error('Can only add objects to GenericCollection')
        }

        return Reflect.set(
          target,
          property,
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

  async $get (signal, opts = {}) {
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
    this.length = 0
    this.#proxy.push(...body)
    return body
  }

  $new (data) {
    const newIndex = this.#proxy.push(data) - 1
    return this.#proxy[newIndex]
  }
}

export default GenericCollection
