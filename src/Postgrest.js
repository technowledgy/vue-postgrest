import pg from '@/mixin'
import { AuthError } from '@/errors'

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
    accept: {
      type: String
    },
    limit: {
      type: Number
    },
    offset: {
      type: Number
    },
    count: {
      type: String
    },
    newTemplate: {
      type: Object
    }
  },
  computed: {
    pgConfig () {
      return {
        route: this.route,
        apiRoot: this.apiRoot,
        token: this.token,
        query: this.query,
        accept: this.accept,
        limit: this.limit,
        offset: this.offset,
        count: this.count,
        newTemplate: this.newTemplate
      }
    }
  },
  onError (err) {
    if (err instanceof AuthError) {
      this.$emit('token-error', err)
    } else {
      this.$emit('get-error', err)
    }
  },
  render (h) {
    return this.$scopedSlots.default(this.pg)
  }
}
