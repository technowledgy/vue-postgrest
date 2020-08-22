import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'
import { createPKQuery, mapAliasesFromSelect, reflect } from '@/utils'

class GenericCollection extends Array {
  #options
  #proxy
  #range

  constructor (options, ...models) {
    super()
    this.#options = options

    // ObservableFunctions need to be defined on the instance, because they keep state
    const $get = new ObservableFunction(this.$get.bind(this))
    // $new needs to access private #proxy instance field - need to bind it to this
    const $new = this.$new.bind(this)

    this.#range = {}

    this.#proxy = new Proxy(this, {
      deleteProperty: reflect.bind(this, 'deleteProperty', ['$get', '$new', '$range'], false),
      defineProperty: reflect.bind(this, 'defineProperty', ['$get', '$new', '$range'], false),
      get: (target, property, receiver) => {
        switch (property) {
          case '$get': return $get
          case '$new': return $new
          case '$range': return this.#range
          default: return Reflect.get(target, property, receiver)
        }
      },
      set: (target, property, value, receiver) => {
        if (['length', '__proto__'].includes(property)) return Reflect.set(target, property, value, receiver)

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
