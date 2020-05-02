import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'
import Schema from '@/Schema'
import { AuthError } from '@/errors'

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
      routeHandler: null
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
        resetNewItem: this.create !== undefined ? this.resetNewItem : undefined
      }
    }
  },
  methods: {
    async refresh () {
      try {
        await this.get()
      } catch (e) {
        if (e instanceof AuthError) {
          this.$emit('token-error', e)
        } else {
          this.$emit('get-error', e)
        }
      }
    },
    async _get () {
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
    },
    loadSchema () {
      this.schema = new Schema(this.apiRoot, this.token)
      this.routeHandler = this.schema.$route(this.route)
    },
    resetNewItem () {
      this.newItem = new GenericModel(this.create, {
        route: this.routeHandler,
        select: (this.query ?? {}).select
      })
    }
  },
  created () {
    this.loadSchema()
    this.$watch('apiRoot', () => {
      this.loadSchema()
      this.refresh()
    })
    this.$watch('token', () => {
      this.loadSchema()
      this.refresh()
    })
    this.$watch('route', () => {
      this.loadSchema()
      this.refresh()
    })
    this.$watch('query', this.refresh, { deep: true })
    this.$watch('offset', this.refresh)
    this.$watch('limit', this.refresh)
    this.$watch('create', (newData) => {
      this.newItem = new GenericModel(newData, {
        route: this.routeHandler,
        select: (this.query ?? {}).select
      })
    }, { immediate: true })
    this.refresh()
  },
  render (h) {
    return this.$scopedSlots.default(this.scope)
  }
}
