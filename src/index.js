import Plugin from '@/Plugin'
import { setDefaultToken } from '@/Schema'
import pg from '@/mixin'
import { AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError } from '@/errors'
import usePostgrest from '@/use'

export { pg, AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError, setDefaultToken, usePostgrest, Plugin as default }
