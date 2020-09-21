import { PrimaryKeyError } from '@/errors'

function createPKQuery (pkColumns = [], data = {}) {
  try {
    // we can't get/put/patch/delete on a route without PK
    if (pkColumns.length === 0) throw new PrimaryKeyError()
    return pkColumns.reduce((query, col) => {
      if (data[col] === undefined || data[col] === null) {
        throw new PrimaryKeyError(col)
      }
      // TODO: do we need .is for Boolean PKs?
      query[col + '.eq'] = data[col]
      return query
    }, {})
  } catch (e) {
    if (e instanceof PrimaryKeyError) {
      // we are returning the PrimaryKeyError here, because it will be thrown later again,
      // when one of the methods that need a query to succeed is called
      return e
    } else {
      throw e
    }
  }
}

export { createPKQuery }
