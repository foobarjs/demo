import { resource } from '@foobarjs/framework';

export default resource('ProductResource', {
  toObject(product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      price: product.price,
      inventory: product.inventory,
      status: product.status,
      categoryId: product.categoryId,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      orderItemsCount: product.orderItemsCount,
    };
  },
});
