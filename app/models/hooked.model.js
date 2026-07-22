import { Model, Field } from 'foobarjs/orm'

let calls = []

class Hooked extends Model {
  static schema = {
    name: Field.string().required(),
    value: Field.string().nullable(),
  }
  static timestamps = true
  static admin = false

  beforeValidate() { calls.push('beforeValidate') }
  afterValidate() { calls.push('afterValidate') }
  beforeSave() { calls.push('beforeSave') }
  afterSave() { calls.push('afterSave') }
  beforeCreate() { calls.push('beforeCreate') }
  afterCreate() { calls.push('afterCreate') }
  beforeUpdate() { calls.push('beforeUpdate') }
  afterUpdate() { calls.push('afterUpdate') }
  beforeDelete() { calls.push('beforeDelete') }
  afterDelete() { calls.push('afterDelete') }
  afterFetch() { calls.push('afterFetch') }
}

export default Hooked
export { calls }
