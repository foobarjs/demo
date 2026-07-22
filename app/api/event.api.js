import { Api } from 'foobarjs/api'
import Event from '../models/event.model.js'

export default Api.resource(Event)
  .only(['index', 'show'])
  .filterable(['status', 'organizer'])
  .sortable(['startsAt', 'title', 'createdAt'])
  .includable(['organizer'])
