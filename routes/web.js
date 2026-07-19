import HomeController from '../app/controllers/home.controller.js'

export default function (router) {
  router.get('/', HomeController, 'index').public()
  router.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() })).public()
}
