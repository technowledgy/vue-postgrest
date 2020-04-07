import PrimaryKeyError from '@/errors/PrimaryKeyError'
import wrap from '@/utils/wrap'
import isObject from '@/utils/isObject'
import Vue from 'vue'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import syncObjects from '@/utils/syncObjects'

const GenericModelTemplate = Vue.extend({
  data () {
    return {
      data: {},
      diff: {},
      resetCache: {},
      request: null,
      primaryKeys: []
    }
  },
  created () {
    this.watchers = {}
  },
  computed: {
    query () {
      return this.primaryKeys && this.primaryKeys.reduce((q, pk) => {
        if (this.resetCache[pk] === undefined) {
          throw new PrimaryKeyError(pk)
        }
        q[pk] = 'eq.' + this.resetCache[pk]
        return q
      }, {})
    },
    isDirty () {
      return Object.keys(this.diff).length > 0
    }
  },
  methods: {
    async _post (opt) {
      const defaultOptions = { sync: true, columns: Object.keys(this.data) }
      const options = Object.assign({}, defaultOptions, opt)
      const requestOptions = {}
      if (options.sync && this.select) {
        requestOptions.select = this.select
      }
      if (options.columns !== undefined) {
        requestOptions.columns = options.columns
      }
      const ret = await this.request('POST', requestOptions, { representation: options.sync }, cloneDeep(this.data))
      if (options.sync && ret && ret.body) {
        this.setData(ret.body[0])
      } else {
        this.reset()
      }
      return ret
    },
    async _patch (data = {}, opt) {
      if (!isObject(data) || Array.isArray(data)) {
        throw new Error('Patch data must be an object.')
      }
      const patchData = Object.assign({}, this.diff, data)
      if (Object.keys(patchData).length === 0) {
        return
      }
      const defaultOptions = { sync: true, columns: Object.keys(patchData) }
      const options = Object.assign({}, defaultOptions, opt)

      const requestOptions = { ... this.query }
      if (options.sync && this.select) {
        requestOptions.select = this.select
      }
      if (options.columns !== undefined) {
        requestOptions.columns = options.columns
      }

      const ret = await this.request('PATCH', requestOptions, { representation: options.sync }, cloneDeep(patchData))
      if (options.sync && ret && ret.body) {
        this.setData(ret.body[0])
      } else {
        this.reset()
      }
      return ret
    },
    async _delete () {
      return await this.request('DELETE', this.query)
    },
    setData (data) {
      this.diff = {}
      this.resetCache = cloneDeep(data)
      syncObjects(this.data, data)
    },
    reset () {
      this.setData(this.resetCache)
    }
  }
})

class GenericModel extends GenericModelTemplate {
  constructor (data, requestCB, primaryKeys, select) {
    super()
    this.setData(cloneDeep(data))
    this.request = requestCB
    this.primaryKeys = primaryKeys
    this.post = wrap(this._post)
    if (this.primaryKeys && this.primaryKeys.length > 0) {  
      this.patch = wrap(this._patch)
      this.delete = wrap(this._delete)
    }
    this.select = select
    this.$watch('data', {
      deep: false,
      immediate: true,
      handler (newData) {
        for (const prop in newData) {
          if (!this.watchers[prop]) {
            this.$watch('data.' + prop, {
              deep: true,
              handler (newVal) {
                if (isEqual(newVal, this.resetCache[prop])) {
                  this.$delete(this.diff, prop)
                } else {
                  this.$set(this.diff, prop, newVal)
                }
              }
            })
            this.watchers[prop] = true
          }
        }
      }
    })
  }
}

export default GenericModel
