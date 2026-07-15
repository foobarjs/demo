import SendWelcomeEmail from '../app/jobs/send-welcome-email.job.js'

export default function (scheduler) {
  scheduler
    .job(SendWelcomeEmail, { email: 'digest@example.com' })
    .dailyAt('9:00')
    .name('daily-digest')

  scheduler
    .call(async () => {
      console.log('Hourly cleanup ran at', new Date().toISOString())
    })
    .hourly()
    .name('hourly-cleanup')
}
