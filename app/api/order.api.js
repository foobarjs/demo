import { Api } from 'foobarjs/api'
import Order from '../models/order.model.js'

export default Api.resource(Order)
  .middleware('auth')
  .only(['index', 'show'])
  .hidden(['email'])
  .filterable(['status', 'event'])
  .sortable(['createdAt', 'total'])
