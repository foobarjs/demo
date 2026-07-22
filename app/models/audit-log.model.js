import { CustomModel, Field } from 'foobarjs/orm'

const LOGS = [
  { id: 1, action: 'event.created', modelType: 'Event', modelId: 1, userId: 1, changes: '{"title":"Tech Conference 2026"}', createdAt: '2026-07-15 08:00:00' },
  { id: 2, action: 'order.confirmed', modelType: 'Order', modelId: 1, userId: null, changes: '{"status":"confirmed"}', createdAt: '2026-07-15 09:30:00' },
  { id: 3, action: 'attendee.checked_in', modelType: 'Attendee', modelId: 1, userId: 1, changes: '{"checkedInAt":"2026-07-20 10:00:00"}', createdAt: '2026-07-20 10:00:00' },
  { id: 4, action: 'event.published', modelType: 'Event', modelId: 2, userId: 1, changes: '{"status":"published"}', createdAt: '2026-07-16 14:00:00' },
  { id: 5, action: 'discount.created', modelType: 'DiscountCode', modelId: 1, userId: 1, changes: '{"code":"EARLY20"}', createdAt: '2026-07-17 11:00:00' },
]

let nextId = LOGS.length + 1

export default class AuditLog extends CustomModel {
  static tableName = 'audit_logs'

  static schema = {
    action: Field.string().required(),
    modelType: Field.string().required(),
    modelId: Field.number().nullable(),
    userId: Field.number().nullable(),
    changes: Field.text().nullable(),
    createdAt: Field.datetime().nullable(),
  }

  static async $list({ page = 1, perPage = 15, filters, sort, search } = {}) {
    let data = [...LOGS]

    if (search) {
      const q = search.toLowerCase()
      data = data.filter(l =>
        l.action.toLowerCase().includes(q) || l.modelType.toLowerCase().includes(q)
      )
    }

    if (filters?.action) {
      data = data.filter(l => l.action === filters.action)
    }
    if (filters?.modelType) {
      data = data.filter(l => l.modelType === filters.modelType)
    }

    if (sort?.sortBy) {
      const key = sort.sortBy
      const dir = sort.sortOrder === 'asc' ? 1 : -1
      data.sort((a, b) => (a[key] > b[key] ? dir : -dir))
    } else {
      data.sort((a, b) => b.id - a.id)
    }

    const total = data.length
    const start = (page - 1) * perPage
    data = data.slice(start, start + perPage)

    return { data, meta: { total, page, perPage } }
  }

  static async $find(id) {
    return LOGS.find(l => l.id === Number(id)) || null
  }

  static async $create(data) {
    const entry = { id: nextId++, ...data, createdAt: new Date().toISOString() }
    LOGS.push(entry)
    return entry
  }
}
