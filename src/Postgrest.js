import superagent from 'superagent'
import url from '@/utils/url'
import wrap from '@/utils/wrap'
import GenericModel from '@/models/GenericModel'
import SchemaManager from '@/SchemaManager'
import EmittedError from '@/errors/EmittedError'
import syncObjects from '@/utils/syncObjects'
import headerStringToObject from '@/utils/headerStringToObject'

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
      get: wrap(this._get),
      primaryKeys: [],
      rpc: wrap(this._rpc)
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
    async request (method, query = {}, options = {}, data) {
      const headers = {}

      switch (options.accept) {
        case 'single':
          headers.accept = 'application/vnd.pgrst.object+json'
          break
        case 'binary':
          headers.accept = 'application/octet-stream'
          break
        case undefined:
        case '':
          headers.accept = 'application/json'
          break
        default:
          headers.accept = options.accept
      }

      if (options.limit || options.offset) {
        const range = [options.offset || 0, options.limit - 1 || null]
        if (range[1] && options.offset) range[1] += options.offset
        headers['range-unit'] = 'items'
        headers.range = range.join('-')
      }

      const prefer = []
      if (options.return) {
        prefer.push('return=' + options.return)
      }
      if (options.count) {
        prefer.push('count=' + options.count)
      }
      if (prefer.length > 0) {
        headers.prefer = prefer.join(',')
      }

      if (this.token) {
        headers.authorization = `Bearer ${this.token}`
      }

      const reqUrl = this.apiRoot + url({ [options.route || this.route]: query })

      // overwrite headers with custom headers if set
      if (options.headers) {
        Object.assign(headers, options.headers)
      }

      let resp
      try {
        if (options.accept === 'binary') {
          resp = await superagent(method, reqUrl)
            .responseType('blob')
            .set(headers)
            .send(data)
        } else {
          resp = await superagent(method, reqUrl)
            .set(headers)
            .send(data)
        }
        return resp
      } catch (e) {
        resp = e.response
        if (resp && resp.headers['www-authenticate']) {
          const authError = headerStringToObject(resp.headers['www-authenticate'].replace('Bearer ', ''))
          this.$emit('token-error', authError)
          throw new EmittedError(authError)
        } else {
          throw e
        }
      }
    },
    async _get () {
      try {
        if (!this.query) {
          return
        }
        const resp = await this.request('GET', this.query, {
          accept: this.accept,
          limit: this.limit,
          offset: this.offset,
          count: this.count
        })
        if (this.accept === 'single') {
          this.items = null
          this.item = resp && resp.body ? new GenericModel(resp.body, this.request, this.primaryKeys, (this.query || {}).select) : {}
        } else if (!this.accept) {
          this.item = null
          this.items = resp && resp.body ? resp.body.map(data => {
            return new GenericModel(data, this.request, this.primaryKeys, (this.query || {}).select)
          }) : []
        } else {
          this.item = null
          this.items = null
          this.data = resp.body
        }

        if (resp && resp.headers['content-range']) {
          const contentRange = resp.headers['content-range'].split('/')
          const range = contentRange[0].split('-')
          this.range = {
            totalCount: contentRange[1] === '*' ? undefined : parseInt(contentRange[1]),
            first: parseInt(range[0]),
            last: parseInt(range[1])
          }
        } else {
          this.range = undefined
        }
        return resp
      } catch (e) {
        this.$emit('get-error', e)
        throw new EmittedError(e)
      }
    },
    async _rpc (fn, opts = {}, params) {
      if (!opts.method) {
        opts.method = 'POST'
      }
      if (!['POST', 'GET'].includes(opts.method)) {
        throw new Error('RPC endpoint only supports "POST" and "GET" methods.')
      }
      const requestOptions = { route: 'rpc/' + fn, accept: opts.accept, headers: opts.headers }
      if (opts.method === 'GET') {
        return this.request('GET', params, requestOptions)
      } else {
        return this.request(opts.method, {}, requestOptions, params)
      }
    },
    async getPrimaryKeys () {
      const pks = await SchemaManager.getPrimaryKeys(this.apiRoot, this.token)
      syncObjects(this.primaryKeys, pks[this.route] || [])
    },
    resetNewItem () {
      if (!this.create) {
        throw new Error('Create template not provided.')
      } else {
        this.newItem = new GenericModel(this.create, this.request, this.primaryKeys, (this.query || {}).select)
      }
    }
  },
  created () {
    this.getPrimaryKeys()
    this.$watch('apiRoot', () => {
      this.getPrimaryKeys()
      this.get.call()
    })
    this.$watch('route', () => {
      this.getPrimaryKeys()
      this.get.call()
    })
    this.$watch('query', this.get.call, { deep: true })
    this.$watch('offset', this.get.call)
    this.$watch('limit', this.get.call)
    this.$watch('create', (newData) => {
      this.newItem = new GenericModel(newData, this.request, this.primaryKeys, (this.query || {}).select)
    }, { immediate: true })
    this.get.call()
  },
  render (h) {
    return this.$scopedSlots.default(this.scope)
  }
}
