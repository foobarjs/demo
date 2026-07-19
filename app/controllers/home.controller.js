import { Controller } from 'foobarjs/core'
import Product from '../models/product.model.js'
import Category from '../models/category.model.js'

class HomeController extends Controller {
  static auth = false
  async index() {
    const [featured, categories] = await Promise.all([
      Product.where('published', true).orderBy('createdAt', 'desc').limit(4).get(),
      Category.all(),
    ])
    return this.render('home/index', { featured, categories })
  }
}

export default HomeController
