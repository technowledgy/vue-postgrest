export default class PrimaryKeyError extends Error {
  constructor (pk) {
    super('Instance has no primary key \"' + pk + '\"')
    this.name = 'PrimaryKeyError'
  }
}