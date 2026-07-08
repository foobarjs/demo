import Product from '../models/product.model.js'
import Category from '../models/category.model.js'

class ProductsController {
  async index(c) {
    return Product.all()
  }

  async show(c) {
    const id = c.req.param('id')
    const product = await Product.find(parseInt(id))
    if (!product) return c.json({ error: 'Not found' }, 404)
    return product
  }
}

export default ProductsController
