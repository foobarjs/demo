import { Job } from 'foobarjs/queue'
import { Logger } from 'foobarjs/core'

class SendWelcomeEmail extends Job {
  static queue = 'default'

  async handle(user) {
    Logger.instance().info(`Welcome email sent to ${user.email}`)
    return { sent: true, to: user.email }
  }
}

export default SendWelcomeEmail
