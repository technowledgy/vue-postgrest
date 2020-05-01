import Vue from 'vue'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { isObject, syncObjects } from '@/utils'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'

const GenericModelTemplate = Vue.extend({
  data () {
    return {
      data: {},
      diff: {},
      resetCache: {}
    }
  },
  created () {
    this.watchers = {}
  },
  computed: {
    isDirty () {
      return Object.keys(this.diff).length > 0
    }
  },
  methods: {
    async _get (opts = {}) {
      const defaultOptions = { accept: 'single' }
      const { keepChanges, ...options } = Object.assign({}, defaultOptions, opts)

      const query = await this._query()
      if (this.select) {
        query.select = this.select
      }
      const resp = await this.route.get(query, { ...options, accept: 'single' })
      const body = await resp.json()

      this.setData(body, keepChanges)
      return body
    },
    async _post (opts) {
      const defaultOptions = { return: 'representation', columns: Object.keys(this.data) }
      const { columns, ...options } = Object.assign({}, defaultOptions, opts)

      const query = {}
      if (options.return === 'representation' && this.select) {
        query.select = this.select
      }
      if (columns) {
        query.columns = columns
      }

      const resp = await this.route.post(query, { ...options, accept: 'single' }, cloneDeep(this.data))
      const body = await resp.json()

      if (options.return === 'representation') {
        this.setData(body)
      } else {
        this.reset()
      }
      return body
    },
    async _patch (data = {}, opts) {
      if (!isObject(data) || Array.isArray(data)) {
        throw new Error('Patch data must be an object.')
      }
      const patchData = Object.assign({}, this.diff, Object.keys(data).reduce((acc, key) => {
        if (data[key] !== undefined) {
          acc[key] = data[key]
        }
        return acc
      }, {}))
      const defaultOptions = { return: 'representation', columns: Object.keys(patchData) }
      const { columns, ...options } = Object.assign({}, defaultOptions, opts)

      const query = await this._query()
      if (options.return === 'representation' && this.select) {
        query.select = this.select
      }
      if (columns) {
        query.columns = columns
      }

      // no empty requests
      if (Object.keys(patchData).length === 0) {
        return
      }

      const resp = await this.route.patch(query, { ...options, accept: 'single' }, cloneDeep(patchData))
      const body = await resp.json()

      if (options.return === 'representation') {
        this.setData(body)
      } else {
        this.reset()
      }
      return body
    },
    async _delete (options = {}) {
      const query = await this._query()
      if (options.return === 'representation' && this.select) {
        query.select = this.select
      }

      const resp = await this.route.delete(query, { ...options, accept: 'single' })
      return await resp.json()
    },
    async _query () {
      await this.route.$ready
      if (this.route.pks.length === 0) throw new PrimaryKeyError()
      return this.route.pks.reduce((q, pk) => {
        if (this.resetCache[pk] === undefined || this.resetCache[pk] === null) {
          throw new PrimaryKeyError(pk)
        }
        q[pk + '.eq'] = this.resetCache[pk]
        return q
      }, {})
    },
    setData (data, keepDiff = false) {
      this.resetCache = cloneDeep(data)
      if (keepDiff) {
        const diff = cloneDeep(this.diff)
        syncObjects(this.data, data)
        syncObjects(this.data, diff, false)
      } else {
        syncObjects(this.data, data)
      }
    },
    reset () {
      this.setData(this.resetCache)
    }
  }
})

class GenericModel extends GenericModelTemplate {
  constructor (data, { route, select }) {
    super()
    this.setData(cloneDeep(data))
    this.route = route
    this.select = select
    this.get = new ObservableFunction(this._get)
    this.post = new ObservableFunction(this._post)
    this.patch = new ObservableFunction(this._patch)
    this.delete = new ObservableFunction(this._delete)
    this.$watch('data', {
      deep: true,
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
