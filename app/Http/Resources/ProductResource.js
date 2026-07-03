import { Resource } from '@foobarjs/framework';

export default class ProductResource extends Resource {
  toObject(product, ctx, { withCount = [] } = {}) {
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
      category: product.whenLoaded('category', category => category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
      } : null),
      orderItemsCount: withCount.includes('orderItems') ? product.orderItemsCount : undefined,
    };
  }
}
