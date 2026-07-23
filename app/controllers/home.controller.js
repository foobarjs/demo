import { Controller } from 'foobarjs/core'
import Event from '../models/event.model.js'

class HomeController extends Controller {
  static withoutMiddleware = ["auth"]
  async index() {
    const events = await Event.where('status', 'published')
      .orderBy('startsAt', 'asc')
      .limit(6)
      .get()
    return this.render('home/index', { events })
  }
}

export default HomeController
