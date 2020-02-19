export default class EmittedError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'EmittedError'
  }
}
