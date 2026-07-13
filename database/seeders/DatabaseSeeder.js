import User from '../../app/models/user.model.js'
import Category from '../../app/models/category.model.js'
import Product from '../../app/models/product.model.js'

export default async function seed() {
  const existingUser = await User.where('email', 'admin@foobar.com').first()
  if (!existingUser) {
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@foobar.com',
      password: 'aaaaaaaa',
    })
    // isAdmin / roles are guarded against mass assignment; set them explicitly.
    admin.forceFill({ isAdmin: true, roles: ['admin'] })
    await admin.save()
    console.log('Created admin user: admin@foobar.com / aaaaaaaa')
  }

  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
    { name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories' },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Household items' },
    { name: 'Books', slug: 'books', description: 'Books and media' },
  ]

  const createdCategories = []
  for (const cat of categories) {
    const existing = await Category.where('slug', cat.slug).first()
    if (existing) {
      createdCategories.push(existing)
    } else {
      const c = await Category.create(cat)
      createdCategories.push(c)
    }
  }

  const products = [
    { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Bluetooth noise-cancelling headphones', price: 79.99, stock: 50, category: createdCategories[0].id, published: true },
    { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart rate monitor', price: 199.99, stock: 30, category: createdCategories[0].id, published: true },
    { name: 'USB-C Hub', slug: 'usb-c-hub', description: '7-port USB-C adapter with HDMI', price: 34.99, stock: 100, category: createdCategories[0].id, published: true },
    { name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: '100% organic cotton, available in 5 colors', price: 24.99, stock: 200, category: createdCategories[1].id, published: true },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic denim jacket with modern fit', price: 89.99, stock: 40, category: createdCategories[1].id, published: true },
    { name: 'Plant Pot Set', slug: 'plant-pot-set', description: 'Set of 3 ceramic plant pots', price: 29.99, stock: 75, category: createdCategories[2].id, published: true },
    { name: 'LED Desk Lamp', slug: 'led-desk-lamp', description: 'Adjustable brightness, USB charging port', price: 44.99, stock: 60, category: createdCategories[2].id, published: true },
    { name: 'JavaScript: The Good Parts', slug: 'js-good-parts', description: 'Classic JS book by Douglas Crockford', price: 19.99, stock: 150, category: createdCategories[3].id, published: true },
    { name: 'Clean Code', slug: 'clean-code', description: 'Software craftsmanship by Robert C. Martin', price: 29.99, stock: 120, category: createdCategories[3].id, published: true },
    { name: 'Design Patterns', slug: 'design-patterns', description: 'Gang of Four patterns reference', price: 39.99, stock: 80, category: createdCategories[3].id, published: true },
  ]

  let productCount = 0
  for (const p of products) {
    const existing = await Product.where('slug', p.slug).first()
    if (!existing) {
      await Product.create(p)
      productCount++
    }
  }

  console.log(`Seeded ${createdCategories.length} categories and ${productCount || products.length} products`)
}
