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
        totalCount: (this.query !== undefined && !this.single) ? Math.random() : undefined
      }
    }
  },
  render (h) {
    try {
      return this.$scopedSlots.default(this.scope)
    } catch (e) {
      if (e instanceof TypeError) {
        return h()
      } else {
        throw e
      }
    }
  }
}
