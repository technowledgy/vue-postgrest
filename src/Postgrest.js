import pg from '@/mixin'

export default {
  name: 'Postgrest',
  mixins: [pg],
  props: {
    route: {
      type: String,
      required: true
    },
    apiRoot: {
      type: String
    },
    token: {
      type: String
    },
    query: {
      type: Object
    },
    single: {
      type: Boolean
    },
    limit: {
      type: Number
    },
    offset: {
      type: Number
    },
    count: {
      type: String
    }
  },
  computed: {
    pgConfig () {
      return {
        route: this.route,
        apiRoot: this.apiRoot,
        token: this.token,
        query: this.query,
        single: this.single,
        limit: this.limit,
        offset: this.offset,
        count: this.count
      }
    }
  },
  onError (err) {
    this.$emit('error', err)
  },
  render (h) {
    return this.$scopedSlots.default(this.pg)
  }
}
