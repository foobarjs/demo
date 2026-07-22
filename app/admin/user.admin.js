import { Admin, Action, Column, Section, Field } from 'foobarjs/admin'
import User from '../models/user.model.js'

// Note: `roles` renders as a tags input automatically. The schema declares
// `Field.json().enum('admin', 'organizer').multiple()` and admin infers the
// widget + options from that — no per-field config here.

export default Admin.resource(User)
  .label('Users', 'User')
  .icon('bi-people')
  .group('System')
  .displayLabel(u => u.name || u.email)
  .permissions({
    view: ['admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
  })
  .searchable('name', 'email')
  .defaultSort('createdAt', 'desc')
  .list(list => list
    .columns([
      Column.text('name').sortable(),
      Column.text('email'),
      Column.date('createdAt').sortable(),
    ])
    .actions([
      Action.make('changePassword', 'Change Password')
        .icon('bi-key')
        .confirm('Set a new password for this user.')
        .form([
          Field.password('password').label('New Password').required()
            .helpText('Minimum 8 characters'),
        ])
        .handler(async (user, { formData }) => {
          if (!formData.password || formData.password.length < 8) {
            throw new Error('Password must be at least 8 characters.')
          }
          user.password = formData.password
          await user.save()
          return 'Password updated.'
        }),
    ])
  )
  .form(form => form
    .sections([
      Section.make('Account').fields(['name', 'email']).columns(2),
      Section.make('Roles').fields(['roles']),
    ])
  )
  .detail(detail => detail
    .sections([
      Section.make('Account').fields(['name', 'email']).columns(2),
      Section.make('Roles').fields(['roles']),
      Section.make('Timestamps').fields(['createdAt', 'updatedAt']).columns(2),
    ])
  )
