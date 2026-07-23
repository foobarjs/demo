import { Api } from 'foobarjs/api'
import Event from '../models/event.model.js'

// Events are a public catalog — anyone can browse. Reads (index/show) are
// public; the resource only exposes those two verbs anyway (via .only()), so
// no writes are reachable regardless of auth default.
export default Api.resource(Event)
  .only(['index', 'show'])
  .public()
  .filterable(['status', 'organizer'])
  .sortable(['startsAt', 'title', 'createdAt'])
  .includable(['organizer'])
