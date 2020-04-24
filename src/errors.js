class EmittedError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'EmittedError'
  }
}

class PrimaryKeyError extends Error {
  constructor (pk) {
    super('Instance has no primary key "' + pk + '"')
    this.name = 'PrimaryKeyError'
  }
}

export {
  EmittedError,
  PrimaryKeyError
}
