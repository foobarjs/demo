import { resource } from '@foobarjs/framework';

export default resource('ProductResource', {
  toObject(product, ctx, { includes = [], withCount = [] } = {}) {
    const category = product.whenLoaded('category');
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      imagePath: product.imagePath,
      price: product.price,
      inventory: product.inventory,
      status: product.status,
      categoryId: product.categoryId,
      category: includes.includes('category') && category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
      } : null,
      orderItemsCount: withCount.includes('orderItems') ? product.orderItemsCount : undefined,
    };
  },
});
