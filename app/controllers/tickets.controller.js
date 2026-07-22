import { Controller } from 'foobarjs/core'
import { Url } from 'foobarjs/support'
import { Str } from 'foobarjs/support'
import { Mailer } from 'foobarjs/mail'
import Attendee from '../models/attendee.model.js'
import Order from '../models/order.model.js'
import SendMagicLinkValidator from '../validators/send-magic-link.validator.js'
import UpdateTicketNameValidator from '../validators/update-ticket-name.validator.js'

const LINK_TTL_SECONDS = 30 * 60  // 30 minutes

class TicketsController extends Controller {
  static auth = false
  static middleware = {
    use: ['auth', 'RequireAttendee'],
    only: ['my', 'edit', 'update'],
  }

  async index() {
    return this.render('tickets/index', { sent: null })
  }

  async send() {
    const request = await this.validateOrBack(SendMagicLinkValidator)
    const email = request.validated().email
    const anyRow = await Attendee.where('email', email).first()

    // Always render "check your inbox" regardless of hit/miss to prevent
    // user enumeration.
    if (anyRow) {
      const link = this._buildMagicLink(email)
      try {
        await Mailer.to(email)
          .subject('Your ticket portal link')
          .text(this._magicLinkBody(link))
          .send()
      } catch (err) {
        this._logger()?.warn?.('[tickets] mail send failed', { message: err.message })
      }
    }

    return this.render('tickets/index', { sent: email })
  }

  async verify() {
    if (!Url.hasValidSignature(this.c)) {
      this.flash('error', 'That link is invalid or has expired. Request a new one.')
      return this.redirect('/tickets')
    }
    // After hasValidSignature() passes, the URL's query params are HMAC-verified
    // — reading them here is equivalent to reading the trusted `params` map that
    // SignedUrl.verify used to return.
    const email = Str.lower(this.query('email'))
    const attendee = await Attendee.where('email', email).first()
    if (!attendee) {
      this.flash('error', 'No tickets found for that email.')
      return this.redirect('/tickets')
    }

    this.login(attendee)
    return this.redirect('/tickets/my')
  }

  async logoutPortal() {
    this.logout()
    return this.redirect('/tickets')
  }

  async my() {
    const email = this.user.email
    // Eager-load relations in the query itself — no per-item .load() loop.
    const [tickets, orders] = await Promise.all([
      Attendee.with('event', 'ticketType').where('email', email).orderBy('createdAt', 'desc').get(),
      Order.with('event').where('email', email).orderBy('createdAt', 'desc').get(),
    ])
    return this.render('tickets/my', { email, tickets, orders })
  }

  async edit() {
    const ticket = await Attendee.with('event', 'ticketType').find(this.param('id'))
    if (!ticket) return this.redirect('/tickets/my')
    await this.authorize('updateName', ticket)
    return this.render('tickets/edit', { ticket })
  }

  async update() {
    const ticket = await Attendee.findOrFail(this.param('id'))
    await this.authorize('updateName', ticket)

    const request = await this.validateOrBack(UpdateTicketNameValidator)
    ticket.name = request.validated().name
    await ticket.save()
    this.flash('success', 'Ticket updated.')
    return this.redirect('/tickets/my')
  }

  // --- helpers ------------------------------------------------------------

  _buildMagicLink(email) {
    return Url.signedRoute('tickets.verify', { email }, { ttl: LINK_TTL_SECONDS })
  }

  _magicLinkBody(link) {
    return [
      'Hi,',
      '',
      'Use this link to view and manage your tickets:',
      link,
      '',
      `The link expires in ${Math.round(LINK_TTL_SECONDS / 60)} minutes.`,
      '',
      "If you didn't request this, you can ignore this email.",
    ].join('\n')
  }

  _logger() {
    return this.c.get('_logger') || this.c.get('logger') || null
  }
}

export default TicketsController
