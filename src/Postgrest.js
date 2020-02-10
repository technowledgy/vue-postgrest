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
  computed: {
    scope () {
      return {
        get: this.query !== undefined ? () => {} : undefined,
        items: (this.query !== undefined && !this.single) ? [] : undefined,
        item: (this.query !== undefined && this.single) ? {} : undefined,
        newItem: this.create !== undefined ? {} : undefined,
        pagination: (this.query !== undefined && !this.single) ? {
          totalCount: Math.random(),
          from: Math.random(),
          to: Math.random()
        } : undefined
      }
    }
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
