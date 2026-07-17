import { Model, Field } from 'foobarjs/orm'

class InventoryLog extends Model {
  static connection = 'postgres'
  static tableName = 'inventory_logs'

  static schema = {
    productName: Field.string().required(),
    sku: Field.string().nullable(),
    quantity: Field.number().required(),
    type: Field.string().enum('inbound', 'outbound', 'adjustment', 'return').required(),
    warehouse: Field.string().nullable(),
    notes: Field.text().nullable(),
  }

  static timestamps = true
}

export default InventoryLog
