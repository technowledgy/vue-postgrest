import superagent from 'superagent'
import url from '@/utils/url'
import wrap from '@/utils/wrap'

export default {
  name: 'Postgrest',
  props: {
    route: {
      type: String,
      required: true
    },
    apiRoot: {
      type: String,
      default: ''
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
      range: undefined,
      get: wrap(this._get, this.$emit)
    }
  },
  computed: {
    scope () {
      return {
        get: this.query !== undefined ? this.get : undefined,
        items: (this.query !== undefined && !this.single) ? this.items : undefined,
        item: (this.query !== undefined && this.single) ? this.item : undefined,
        newItem: this.create !== undefined ? {} : undefined,
        range: this.range
      }
    }
  },
  methods: {
    async _get () {
      let resp
      const headers = {
        'Accept': this.single ? 'application/vnd.pgrst.object+json' : 'application/json',
      }

      if (this.limit || this.offset) {
        const range = [this.offset || 0, this.limit || null]
        if (range[1] && this.offset) range[1] += this.offset
        headers['Range-Unit'] = 'items'
        headers.Range = range.join('-')
      }

      if (this.exactCount) {
        headers.Prefer = 'count=exact'
      }

      resp = await superagent.get(this.apiRoot + url({ [this.route]: this.query }))
        .set(headers)

      if (this.single) {
        this.items = null
        this.item = resp && resp.body || {}
      } else {
        this.item = null
        this.items = resp && resp.body || []
      }

      if (resp && resp.headers['Content-Range']) {
        let contentRange = resp.headers['Content-Range'].split('/')
        let range = contentRange[0].split('-')
        this.range = {
          totalCount: contentRange[1] === '*' ? undefined : parseInt(contentRange[1]),
          first: parseInt(range[0]),
          last: parseInt(range[1])
        }
      } else {
        this.range = undefined
      }
    }
  },
  created () {
    this.$watch('query', this.get.call, {
      deep: true,
      immediate: true
    })
    this.$watch('route', this.get.call, {
      deep: true,
      immediate: true
    })
    this.$watch('apiRoot', this.get.call, {
      deep: true,
      immediate: true
    })
  },
  render (h) {
    try {
      return this.$scopedSlots.default(this.scope)
    } catch (e) {
      if (e instanceof TypeError && e.message === 'this.$scopedSlots.default is not a function') {
        return h()
      } else {
        throw e
      }
    }
  }
}
