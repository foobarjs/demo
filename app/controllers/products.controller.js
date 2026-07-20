import { Controller, NotFoundError } from 'foobarjs/core'
import Product from '../models/product.model.js'
import Category from '../models/category.model.js'

class ProductsController extends Controller {
  static auth = false
  async index() {
    const categorySlug = this.query('category')
    const categories = await Category.all()

    let query = Product.where('published', true)
    let activeCategory = null

    if (categorySlug) {
      activeCategory = await Category.where('slug', categorySlug).first()
      if (activeCategory) {
        query = query.where('category', activeCategory.id)
      }
    }

    const products = await query.orderBy('name', 'asc').get()

    return this.render('products/index', {
      products,
      categories,
      activeCategory,
    })
  }

  async show() {
    const id = parseInt(this.param('id'))
    const product = await Product.with('category', 'tags').find(id)

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    const related = await Product
      .where('published', true)
      .where('category', product.category?.id ?? product.category)
      .whereNotIn('id', [product.id])
      .limit(3)
      .get()

    return this.render('products/show', { product, related })
  }
}

export default ProductsController
