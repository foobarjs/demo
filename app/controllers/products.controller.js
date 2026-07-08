import { Controller } from 'foobarjs/core'
import Product from '../models/product.model.js'

class ProductsController extends Controller {
  async index() {
    return Product.all()
  }

  async show() {
    const id = this.c.req.param('id')
    const product = await Product.find(parseInt(id))
    if (!product) return this.json({ error: 'Not found' }, 404)
    return product
  }
}

export default ProductsController
