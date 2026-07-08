import { Serializer } from 'foobarjs/serialization'

// Example serializer. Shape the JSON output of a Product for API responses,
// picking only the fields you want to expose. Used by ProductsController
// when returning products via the JSON API.
//
// The `foobarjs/api` plugin will auto-serialize Model instances if a
// serializer file exists at this path (app/serializers/<model>.serializer.js).
class ProductSerializer extends Serializer {
  static fields = ['id', 'name', 'slug', 'price', 'stock', 'published']
}

export default ProductSerializer
