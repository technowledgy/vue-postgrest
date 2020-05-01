import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'
import Schema from '@/Schema'
import request from '@/request'
import { EmittedError, AuthError } from '@/errors'

export default {
  name: 'Postgrest',
  props: {
    route: {
      type: String,
      default: undefined
    },
    apiRoot: {
      type: String,
      default: '/'
    },
    query: {
      type: Object,
      default: undefined
    },
    create: {
      type: Object,
      default: undefined
    },
    accept: {
      type: String,
      default: undefined
    },
    limit: {
      type: Number,
      default: undefined
    },
    offset: {
      type: Number,
      default: undefined
    },
    count: {
      type: String,
      default: undefined
    },
    token: {
      type: String,
      default: undefined
    }
  },
  data () {
    return {
      items: [],
      item: {},
      data: null,
      newItem: null,
      range: undefined,
      get: new ObservableFunction(this._get),
      schema: null,
      routeHandler: null,
      rpc: new ObservableFunction(this._rpc)
    }
  },
  computed: {
    scope () {
      return {
        get: this.query !== undefined ? this.get : undefined,
        items: (this.query !== undefined && !this.accept) ? this.items : undefined,
        item: (this.query !== undefined && this.accept === 'single') ? this.item : undefined,
        data: (this.query !== undefined && this.accept && this.accept !== 'single') ? this.data : undefined,
        newItem: this.create !== undefined ? this.newItem : undefined,
        range: this.range,
        rpc: this.rpc,
        resetNewItem: this.create !== undefined ? this.resetNewItem : undefined
      }
    }
  },
  methods: {
    async _get () {
      try {
        if (!this.query) {
          return
        }
        const resp = await this.routeHandler.get(this.query, {
          accept: this.accept,
          limit: this.limit,
          offset: this.offset,
          count: this.count
        })
        let body
        if (this.accept === 'single') {
          this.items = null
          body = await resp.json()
          this.item = new GenericModel(body, {
            route: this.routeHandler,
            select: this.query.select
          })
        } else if (!this.accept) {
          this.item = null
          body = await resp.json()
          this.items = body.map(data => new GenericModel(data, {
            route: this.routeHandler,
            select: this.query.select
          }))
        } else {
          this.item = null
          this.items = null
          this.data = body = await resp.text()
        }

        if (resp.headers.get('Content-Range')) {
          const [range, total] = resp.headers.get('Content-Range').split('/')
          const [first, last] = range.split('-')
          this.range = {
            totalCount: total === '*' ? undefined : parseInt(total),
            first: parseInt(first),
            last: parseInt(last)
          }
        } else {
          this.range = undefined
        }
        return body
      } catch (e) {
        if (e instanceof AuthError) {
          this.$emit('token-error', e)
        } else {
          this.$emit('get-error', e)
        }
        throw new EmittedError(e)
      }
    },
    async _rpc (fn, opts = {}, params) {
      const { get, query, ...requestOptions } = opts
      if (get) {
        return request(this.apiRoot, this.token, 'rpc/' + fn, 'GET', Object.assign({}, query, params), requestOptions)
      } else {
        return request(this.apiRoot, this.token, 'rpc/' + fn, 'POST', query, requestOptions, params)
      }
    },
    loadSchema () {
      this.schema = new Schema(this.apiRoot, this.token)
      this.routeHandler = this.schema.$route(this.route)
    },
    resetNewItem () {
      this.newItem = new GenericModel(this.create, {
        route: this.routeHandler,
        select: (this.query || {}).select
      })
    }
  },
  created () {
    this.loadSchema()
    this.$watch('apiRoot', () => {
      this.loadSchema()
      this.get()
    })
    this.$watch('token', () => {
      this.loadSchema()
      this.get()
    })
    this.$watch('route', () => {
      this.loadSchema()
      this.get()
    })
    this.$watch('query', this.get, { deep: true })
    this.$watch('offset', this.get)
    this.$watch('limit', this.get)
    this.$watch('create', (newData) => {
      this.newItem = new GenericModel(newData, {
        route: this.routeHandler,
        select: (this.query || {}).select
      })
    }, { immediate: true })
    this.get()
  },
  render (h) {
    return this.$scopedSlots.default(this.scope)
  }
}
