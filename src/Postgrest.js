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
    }
  },
  data () {
    return {
      items: null,
      item: null,
      get: wrap(this._get)
    }
  },
  computed: {
    scope () {
      return {
        get: this.query !== undefined ? this.get : undefined,
        items: (this.query !== undefined && !this.single) ? this.items || [] : undefined,
        item: (this.query !== undefined && this.single) ? this.item || {} : undefined,
        newItem: this.create !== undefined ? {} : undefined,
        pagination: (this.query !== undefined && !this.single) ? {
          totalCount: Math.random(),
          from: Math.random(),
          to: Math.random()
        } : undefined
      }
    }
  },
  methods: {
    async _get () {
      const resp = await superagent.get(this.apiRoot + url({ [this.route]: this.query }))
        .set('Accept', this.single ? 'application/vnd.pgrst.object+json' : 'application/json')
      if (this.single) {
        this.items = null
        this.item = resp
      } else {
        this.item = null
        this.items = resp
      }
    }
  },
  created () {
    this.$watch('query', this.get.call, {
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
