import { CustomModel, Field } from 'foobarjs/orm'

const LOGS = [
  { id: 1, level: 'info', message: 'Application started', source: 'bootstrap', createdAt: '2026-07-15 08:00:00' },
  { id: 2, level: 'warning', message: 'Slow query detected (350ms)', source: 'database', createdAt: '2026-07-15 09:12:33' },
  { id: 3, level: 'error', message: 'Failed to send email notification', source: 'mail', createdAt: '2026-07-15 10:45:01' },
  { id: 4, level: 'info', message: 'User admin@example.com logged in', source: 'auth', createdAt: '2026-07-15 11:00:00' },
  { id: 5, level: 'info', message: 'Cache cleared', source: 'cache', createdAt: '2026-07-15 12:30:00' },
  { id: 6, level: 'warning', message: 'Rate limit approaching for API key abc123', source: 'api', createdAt: '2026-07-16 08:15:00' },
  { id: 7, level: 'error', message: 'Payment gateway timeout', source: 'payments', createdAt: '2026-07-16 09:22:45' },
  { id: 8, level: 'info', message: 'Scheduled export completed', source: 'exports', createdAt: '2026-07-16 10:00:00' },
]

let nextId = LOGS.length + 1

export default class SystemLog extends CustomModel {
  static tableName = 'system_logs'

  static schema = {
    level: Field.string().enum('info', 'warning', 'error').required(),
    message: Field.string().required(),
    source: Field.string().required(),
    createdAt: Field.date().nullable(),
  }

  static async $list({ page = 1, perPage = 15, filters, sort, search } = {}) {
    let data = [...LOGS]

    if (search) {
      const q = search.toLowerCase()
      data = data.filter(l =>
        l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q)
      )
    }

    if (filters?.level) {
      data = data.filter(l => l.level === filters.level)
    }
    if (filters?.source) {
      data = data.filter(l => l.source === filters.source)
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

  static async $update(id, data) {
    const entry = LOGS.find(l => l.id === Number(id))
    if (!entry) return null
    Object.assign(entry, data)
    return entry
  }

  static async $delete(id) {
    const idx = LOGS.findIndex(l => l.id === Number(id))
    if (idx !== -1) LOGS.splice(idx, 1)
  }
}
