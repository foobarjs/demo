class HomeController {
  async index(c) {
    return c.render('products/index', { title: 'Foobar Shop' })
  }
}

export default HomeController
