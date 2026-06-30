import { hashPassword } from '@foobarjs/framework';

function productSvg(name, index) {
  const colors = ['#f8fafc', '#eff6ff', '#ecfdf5', '#fff7ed', '#fdf2f8', '#f5f3ff'];
  const accents = ['#0f172a', '#2563eb', '#16a34a', '#ea580c', '#db2777', '#7c3aed'];
  const background = colors[index % colors.length];
  const accent = accents[index % accents.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${name}">
  <rect width="640" height="480" rx="32" fill="${background}"/>
  <circle cx="480" cy="120" r="72" fill="${accent}" opacity=".12"/>
  <rect x="96" y="116" width="448" height="248" rx="28" fill="#fff" stroke="#e5e7eb"/>
  <text x="320" y="242" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" text-anchor="middle">${name}</text>
  <text x="320" y="286" fill="#64748b" font-family="Inter, Arial, sans-serif" font-size="18" text-anchor="middle">Foobar Commerce</text>
</svg>`;
}

export default async function seed({ count, faker, model, storage }) {
  const categories = model('Category');
  const customers = model('Customer');
  const products = model('Product');
  const orders = model('Order');
  const orderItems = model('OrderItem');
  const pages = model('Page');
  const users = model('User');

  users.firstOrCreate({ email: 'admin@shop.test' }, {
    name: 'Demo Admin',
    password: await hashPassword(process.env.FOOBAR_ADMIN_PASSWORD || 'password'),
    role: 'admin',
    status: 'active',
  });

  const categoryNames = ['Bags', 'Desk', 'Drinkware', 'Apparel', 'Accessories'];
  const createdCategories = categoryNames.map((name) => categories.create({
    name,
    slug: faker.slug(name),
    description: faker.paragraph(2),
    status: 'active',
  }));

  const productNames = [
    'Everyday Tote',
    'Canvas Backpack',
    'Walnut Desk Shelf',
    'Insulated Travel Mug',
    'Heavyweight Hoodie',
    'Notebook Set',
    'Cable Organizer',
    'Minimal Desk Mat',
  ];
  const createdProducts = [];
  for (const [index, name] of productNames.entries()) {
    const price = faker.pick([24, 39, 49, 79, 99, 149, 199]);
    const imagePath = `products/${faker.slug(name)}.svg`;
    await storage.disk('public').put(imagePath, productSvg(name, index));
    createdProducts.push(products.create({
      name,
      slug: faker.slug(name),
      sku: `SKU-${String(index + 1).padStart(4, '0')}`,
      description: faker.paragraph(2),
      imagePath,
      price,
      inventory: faker.int(5, 120),
      status: 'active',
      categoryId: faker.pick(createdCategories).id,
    }));
  }

  const createdCustomers = [];
  const customerCount = Math.max(5, count);
  for (let index = 0; index < customerCount; index += 1) {
    const firstName = faker.firstName();
    const lastName = faker.lastName();
    createdCustomers.push(customers.create({
      firstName,
      lastName,
      email: faker.email(firstName, lastName, 'shop.test'),
      phone: `555-01${String(index).padStart(2, '0')}`,
      status: faker.pick(['lead', 'active', 'vip']),
    }));
  }

  for (const title of ['Home', 'Shipping Policy', 'Returns', 'About']) {
    pages.create({
      title,
      slug: faker.slug(title),
      body: faker.paragraph(3),
      status: 'published',
    });
  }

  const statuses = ['pending', 'paid', 'fulfilled', 'cancelled'];
  const orderCount = customerCount * 2;
  for (let index = 0; index < orderCount; index += 1) {
    const customer = faker.pick(createdCustomers);
    const product = faker.pick(createdProducts);
    const quantity = faker.int(1, 3);
    const subtotal = Number((Number(product.price) * quantity).toFixed(2));
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));
    const order = orders.create({
      number: `ORD-${String(index + 1).padStart(5, '0')}`,
      email: customer.email,
      status: faker.pick(statuses),
      subtotal,
      tax,
      shipping,
      total,
      customerId: customer.id,
    });

    orderItems.create({
      orderId: order.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
      total: subtotal,
    });
  }

  return {
    categories: createdCategories.length,
    customers: customerCount,
    products: createdProducts.length,
    orders: orderCount,
    pages: 4,
  };
}
