import GenericCollection from '@/GenericCollection'
import GenericModel from '@/GenericModel'

const mixin = {
  data () {
    return {
      pg: null
    }
  },
  watch: {
    pgConfig: {
      deep: true,
      immediate: true,
      async handler (cfg) {
        if (!cfg) return

        // options object with getters to pass into GenericCollection and GenericModel
        // this way, those will always use the current values
        const makeOptions = () => Object.defineProperties({}, {
          route: {
            get: () => this.$postgrest(this.pgConfig.apiRoot, this.pgConfig.token).$route(this.pgConfig.route),
            enumerable: true
          },
          query: {
            get: () => this.pgConfig.query,
            enumerable: true
          },
          limit: {
            get: () => this.pgConfig.limit,
            enumerable: true
          },
          offset: {
            get: () => this.pgConfig.offset,
            enumerable: true
          },
          count: {
            get: () => this.pgConfig.count,
            enumerable: true
          }
        })
        if (cfg.single && !(this.pg instanceof GenericModel)) {
          this.pg = new GenericModel(makeOptions(), {})
        } else if (!cfg.single && !(this.pg instanceof GenericCollection)) {
          this.pg = new GenericCollection(makeOptions())
        }

        if (this.pg instanceof GenericCollection || cfg.query) {
          try {
            await this.pg?.$get()
          } catch (e) {
            if (this.$options.onError) {
              this.$options.onError.forEach(hook => hook.call(this, e))
            }
          }
        }
      }
    }
  }
}

export default mixin
