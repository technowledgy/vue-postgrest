export default class FieldNotExistsError extends Error {
  constructor (field) {
    super('Instance has no data field \"' + field + '\"')
    this.name = 'FieldNotExistsError'
  }
}