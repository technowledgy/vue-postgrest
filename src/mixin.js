import ObservableFunction from '@/ObservableFunction'
import GenericModel from '@/GenericModel'

// this = component instance, will be bound
async function get (signal) {
  const route = this.$postgrest(this.pgConfig?.apiRoot, this.pgConfig?.token).$route(this.pgConfig?.route)
  const resp = await route.get(this.pgConfig?.query ?? {}, {
    accept: this.pgConfig?.accept,
    limit: this.pgConfig?.limit,
    offset: this.pgConfig?.offset,
    count: this.pgConfig?.count,
    signal
  })

  let data
  switch (this.pgConfig?.accept) {
    case undefined: {
      let range
      if (resp.headers.get('Content-Range')) {
        const [bounds, total] = resp.headers.get('Content-Range').split('/')
        const [first, last] = bounds.split('-')
        range = {
          totalCount: total === '*' ? undefined : parseInt(total, 10),
          first: parseInt(first, 10),
          last: isNaN(parseInt(last, 10)) ? undefined : parseInt(last, 10)
        }
      }
      data = await resp.json()
      return {
        items: data.map(item => new GenericModel({ route, select: this.pgConfig?.query?.select }, item)),
        range
      }
    }
    case 'single':
      data = await resp.json()
      return {
        item: new GenericModel({ route, select: this.pgConfig?.query?.select }, data)
      }
    case 'binary':
      data = await resp.blob()
      return {
        data
      }
    case 'text':
    default:
      data = await resp.text()
      return {
        data
      }
  }
}

const mixin = {
  data () {
    return {
      pg: {}
    }
  },
  watch: {
    pgConfig: {
      deep: true,
      immediate: true,
      handler () {
        // get
        if (this.pgConfig.route && !this.pg?.get) {
          this.$set(this.pg, 'get', new ObservableFunction(async (signal) => {
            try {
              const ret = await get.call(this, signal)
              this.pg = Object.assign({}, ret, {
                get: this.pg.get,
                newItem: this.pg.newItem
              })
              return ret
            } catch (e) {
              if (this.$options.onError) {
                this.$options.onError.forEach(hook => hook.call(this, e))
              }
              throw e
            }
          }))
        } else if (!this.pgConfig.route && this.pg?.get) {
          this.$delete(this.pg, 'get')
        }
        // newItem
        if (this.pgConfig.newTemplate) {
          if (!this.pg.newItem?.$isDirty) {
            const route = this.$postgrest(this.pgConfig?.apiRoot, this.pgConfig?.token).$route(this.pgConfig?.route)
            this.$set(this.pg, 'newItem', new GenericModel({ route, select: this.pgConfig?.query?.select }, this.pgConfig.newTemplate))
          }
        } else {
          this.$delete(this.pg, 'newItem')
        }
        // auto-refresh only when query is set
        if (this.pgConfig?.query) {
          // eslint-disable-next-line no-unused-expressions
          this.pg?.get?.().catch(() => {})
        }
      }
    }
  }
}

export default mixin
