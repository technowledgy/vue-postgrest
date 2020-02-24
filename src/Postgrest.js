import superagent from 'superagent'
import url from '@/utils/url'
import wrap from '@/utils/wrap'
import GenericModel from '@/models/GenericModel'
import SchemaManager from '@/SchemaManager'
import EmittedError from '@/errors/EmittedError'
import syncObjects from '@/utils/syncObjects'

export default {
  name: 'Postgrest',
  props: {
    route: {
      type: String,
      required: true
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
    single: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: undefined
    },
    offset: {
      type: Number,
      default: undefined
    },
    exactCount: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      items: [],
      item: {},
      newItem: null,
      range: undefined,
      get: wrap(this._get),
      primaryKeys: []
    }
  },
  computed: {
    scope () {
      return {
        get: this.query !== undefined ? this.get : undefined,
        items: (this.query !== undefined && !this.single) ? this.items : undefined,
        item: (this.query !== undefined && this.single) ? this.item : undefined,
        newItem: this.create !== undefined ? this.newItem : undefined,
        range: this.range,
        rpc: this.rpc,
        resetNewItem: this.create !== undefined ? this.resetNewItem : undefined
      }
    },
    url () {
      return this.apiRoot + this.route
    }
  },
  methods: {
    async request (method, query = {}, opts = {}, data) {
      const headers = {
        'accept': opts.single ? 'application/vnd.pgrst.object+json' : 'application/json'
      }
      if (opts.limit || opts.offset) {
        const range = [opts.offset || 0, opts.limit - 1 || null]
        if (range[1] && opts.offset) range[1] += opts.offset
        headers['range-unit'] = 'items'
        headers.range = range.join('-')
      }
      headers.prefer = opts.representation ? 'return=representation' : 'return=minimal'
      if (opts.exactCount) {
        headers.prefer = headers.prefer + ',count=exact'
      }

      // add instance query (for vertical filtering etc.)
      const q = Object.assign({}, this.query || {}, query)
      const reqUrl = opts.root ? (opts.route ? this.apiRoot + opts.route : this.apiRoot) : this.apiRoot + url({ [opts.route || this.route]: q })
      return superagent(method, reqUrl)
        .set(headers)
        .send(data)
    },
    async _get () {
      try {
        if (!this.query) {
          return
        }
        const resp = await this.request('GET', this.query, {
          single: this.single,
          limit: this.limit,
          offset: this.offset,
          exactCount: this.exactCount
        })

        if (this.single) {
          this.items = null
          this.item = resp && resp.body ? new GenericModel(resp.body, this.request, this.primaryKeys) : {}
        } else {
          this.item = null
          this.items = resp && resp.body ? resp.body.map(data => {
            return new GenericModel(data, this.request, this.primaryKeys)
          }) : []
        }

        if (resp && resp.headers['content-range']) {
          let contentRange = resp.headers['content-range'].split('/')
          let range = contentRange[0].split('-')
          this.range = {
            totalCount: contentRange[1] === '*' ? undefined : parseInt(contentRange[1]),
            first: parseInt(range[0]),
            last: parseInt(range[1])
          }
        } else {
          this.range = undefined
        }
      } catch (e) {
        this.$emit('get-error', e)
        throw new EmittedError(e)
      }
    },
    async rpc (fn, method = 'POST', args = {}) {
      if (!['POST', 'GET'].includes(method)) {
        throw new Error('RPC endpoint only supports "POST" and "GET" methods.')
      }
      return this.request(method, {}, { root: true, route: 'rpc/' + fn }, args)
    },
    async getPrimaryKeys () {
      const pks = await SchemaManager.getPrimaryKeys(this.apiRoot)
      syncObjects(this.primaryKeys, pks[this.route] || [])
    },
    resetNewItem () {
      if (!this.create) {
        throw new Error('Create template not provided.')
      } else {
        this.newItem = new GenericModel(this.create, this.request, this.primaryKeys)
      }
    }
  },
  created () {
    this.getPrimaryKeys()

    this.$watch('url', this.getPrimaryKeys)
    this.$watch('query', this.get.call, {
      deep: true
    })
    this.$watch('route', this.get.call, {
      deep: true
    })
    this.$watch('apiRoot', this.get.call, {
      deep: true
    })
    this.$watch('create', (newData) => {
      this.newItem = new GenericModel(newData, this.request, this.primaryKeys)
    }, {
      immediate: true
    })

    this.get.call()
  },
  render (h) {
    return this.$scopedSlots.default(this.scope)
  }
}
