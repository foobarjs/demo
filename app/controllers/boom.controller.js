import { Controller, HttpException, NotFoundError, ForbiddenError } from 'foobarjs/core'

class BoomController extends Controller {
  async index() {
    const kind = this.c.req.query('kind') || 'generic'
    if (kind === 'generic') {
      throw new Error('kaboom')
    }
    if (kind === 'http') {
      throw new HttpException(418, "I'm a teapot")
    }
    if (kind === 'notfound') {
      throw new NotFoundError('gone with the wind')
    }
    if (kind === 'forbidden') {
      throw new ForbiddenError('no entry')
    }
    if (kind === 'reflected') {
      // For XSS-escape testing
      throw new Error(String(this.c.req.query('msg') || ''))
    }
    return { ok: true }
  }
}

export default BoomController
