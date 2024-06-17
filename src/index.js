import Plugin from '@/Plugin'
import { resetSchemaCache, setDefaultToken } from '@/Schema'
import pg from '@/mixin'
import { AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError } from '@/errors'
import usePostgrest from '@/use'

export { pg, AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError, resetSchemaCache, setDefaultToken, usePostgrest, Plugin as default }
