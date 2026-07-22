import { Controller, HttpException, NotFoundError, ForbiddenError } from 'foobarjs/core'

class BoomController extends Controller {
  static auth = false

  async index() {
    const kind = this.query('kind')
    const msg = this.query('msg')

    switch (kind) {
      case 'http':
        throw new HttpException(418, "I'm a teapot")
      case 'notfound':
        throw new NotFoundError('Not found')
      case 'forbidden':
        throw new ForbiddenError('Forbidden')
      case 'reflected':
        throw new Error(msg || 'reflected error')
      case 'generic':
      default:
        throw new Error('kaboom')
    }
  }
}

export default BoomController
