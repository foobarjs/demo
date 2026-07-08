import { Job } from 'foobarjs/queue'

class SendWelcomeEmail extends Job {
  static queue = 'default'

  async handle(user) {
    // Simulate sending email
    console.log(`Welcome email sent to ${user.email}`)
    return { sent: true, to: user.email }
  }
}

export default SendWelcomeEmail
