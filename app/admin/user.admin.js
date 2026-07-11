import { Admin, Action } from 'foobarjs/admin'
import User from '../models/user.model.js'

export default Admin.resource(User)
  .label('Users', 'User')
  .icon('bi-people')
  .group('System')
  .list(list => list
    .actions([
      Action.make('changePassword', 'Change Password')
        .icon('bi-key')
        .confirm('Set a new password for this user.')
        .form([
          { name: 'password', label: 'New Password', type: 'password', required: true },
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
