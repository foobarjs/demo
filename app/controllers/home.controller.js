import { Controller } from 'foobarjs/core'

class HomeController extends Controller {
  async index() {
    return this.render('products/index', { title: 'Foobar Shop' })
  }
}

export default HomeController
