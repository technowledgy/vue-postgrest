import { inject, shallowRef, triggerRef, unref, watch } from 'vue'
import GenericCollection from '@/GenericCollection'
import GenericModel from '@/GenericModel'
import { postgrestInjectionKey } from '@/injection'
import usePostgrest from '@/use'

function createOptions (configRef, createSchema) {
  return Object.defineProperties({}, {
    route: {
      get: () => {
        const config = unref(configRef)
        return createSchema(config.apiRoot, config.token).$route(config.route)
      },
      enumerable: true
    },
    query: {
      get: () => unref(configRef)?.query,
      enumerable: true
    },
    limit: {
      get: () => unref(configRef)?.limit,
      enumerable: true
    },
    offset: {
      get: () => unref(configRef)?.offset,
      enumerable: true
    },
    count: {
      get: () => unref(configRef)?.count,
      enumerable: true
    }
  })
}

function usePg (pgConfig, options = {}) {
  const createSchema = inject(postgrestInjectionKey, usePostgrest)

  const pg = shallowRef(null)
  const onError = options.onError
  const configRef = shallowRef(unref(pgConfig))

  watch(() => unref(pgConfig), value => {
    configRef.value = value
  }, { deep: true, immediate: true })

  watch(configRef, async cfg => {
    if (!cfg) return

    if (cfg.single && !(pg.value instanceof GenericModel)) {
      pg.value = new GenericModel(createOptions(configRef, createSchema), {})
    } else if (!cfg.single && !(pg.value instanceof GenericCollection)) {
      pg.value = new GenericCollection(createOptions(configRef, createSchema))
    }

    if (pg.value instanceof GenericCollection || cfg.query) {
      try {
        await pg.value?.$get()
        triggerRef(pg)
      } catch (e) {
        onError?.(e)
      }
    }
  }, { deep: true, immediate: true })

  return { pg }
}

export default usePg
