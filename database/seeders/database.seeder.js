import User from '../../app/models/user.model.js'
import Event from '../../app/models/event.model.js'
import TicketType from '../../app/models/ticket-type.model.js'
import Order from '../../app/models/order.model.js'
import Attendee from '../../app/models/attendee.model.js'
import DiscountCode from '../../app/models/discount-code.model.js'

export default async function seed() {
  const existingAdmin = await User.where('email', 'admin@foobar.com').first()
  if (!existingAdmin) {
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@foobar.com',
      password: 'aaaaaaaa',
    })
    admin.forceFill({ isAdmin: true, roles: ['admin'] })
    await admin.save()
    console.log('Created admin user: admin@foobar.com / aaaaaaaa')
  }

  let organizer = await User.where('email', 'organizer@foobar.com').first()
  if (!organizer) {
    organizer = await User.create({
      name: 'Sarah Chen',
      email: 'organizer@foobar.com',
      password: 'aaaaaaaa',
    })
    organizer.forceFill({ roles: ['organizer'] })
    await organizer.save()
    console.log('Created organizer user: organizer@foobar.com / aaaaaaaa')
  }

  const events = [
    {
      title: 'Tech Conference 2026',
      slug: 'tech-conference-2026',
      description: 'A two-day conference covering the latest in web development, AI, and cloud infrastructure. Featuring 30+ speakers and hands-on workshops.',
      startsAt: new Date('2026-09-15T09:00:00Z'),
      endsAt: new Date('2026-09-16T17:00:00Z'),
      venue: 'Moscone Center',
      location: 'San Francisco, CA',
      status: 'published',
      maxAttendees: 500,
      organizer: organizer.id,
      speakers: [
        { name: 'Ada Kim', title: 'Principal Engineer, Vercel', bio: 'Ada leads DX and edge runtime work. She has been shipping web frameworks since 2012.', avatar: 'A' },
        { name: 'Marcus Chen', title: 'Staff SWE, Stripe', bio: 'Payments infrastructure and API design. Author of two O\'Reilly books on distributed systems.', avatar: 'M' },
        { name: 'Priya Raman', title: 'ML Research, Anthropic', bio: 'Alignment research and safety tooling. Previously at DeepMind and OpenAI.', avatar: 'P' },
        { name: 'Diego Alvarez', title: 'CTO, Fly.io', bio: 'Runs the platform team at Fly. Founder of two YC companies.', avatar: 'D' },
      ],
      schedule: [
        { day: 'Day 1 — Tue Sep 15', items: [
          { time: '09:00', title: 'Doors + Coffee', room: 'Lobby' },
          { time: '09:30', title: 'Opening Keynote — The Web in 2030', speaker: 'Ada Kim', room: 'Main Hall' },
          { time: '10:45', title: 'API Design at Scale', speaker: 'Marcus Chen', room: 'Track A' },
          { time: '12:00', title: 'Lunch', room: 'Atrium' },
          { time: '13:30', title: 'Hands-on Edge Workshop', speaker: 'Diego Alvarez', room: 'Track B' },
          { time: '16:00', title: 'Panel — AI Safety in Production', room: 'Main Hall' },
          { time: '18:00', title: 'Attendee Reception', room: 'Rooftop' },
        ] },
        { day: 'Day 2 — Wed Sep 16', items: [
          { time: '09:30', title: 'ML Ops for Small Teams', speaker: 'Priya Raman', room: 'Track A' },
          { time: '11:00', title: 'Building Multi-Tenant SaaS', speaker: 'Marcus Chen', room: 'Track B' },
          { time: '13:00', title: 'Lightning Talks', room: 'Main Hall' },
          { time: '16:00', title: 'Closing Fireside', speaker: 'Ada Kim', room: 'Main Hall' },
        ] },
      ],
    },
    {
      title: 'JavaScript Meetup',
      slug: 'javascript-meetup',
      description: 'Monthly meetup for JavaScript enthusiasts. This month: server-side rendering patterns and the future of Node.js frameworks.',
      startsAt: new Date('2026-08-10T18:30:00Z'),
      endsAt: new Date('2026-08-10T21:00:00Z'),
      venue: 'WeWork Market Street',
      location: 'San Francisco, CA',
      status: 'published',
      maxAttendees: 80,
      organizer: organizer.id,
      speakers: [
        { name: 'Sam Ortiz', title: 'Framework author, HonoJS', bio: 'Ships the fastest edge framework on npm.', avatar: 'S' },
        { name: 'Nora Blake', title: 'DX Lead, Cloudflare', bio: 'Building tools that make Node feel like the browser again.', avatar: 'N' },
      ],
      schedule: [
        { day: 'Aug 10', items: [
          { time: '18:30', title: 'Doors + Pizza', room: 'Main Room' },
          { time: '19:00', title: 'SSR Patterns in 2026', speaker: 'Sam Ortiz', room: 'Main Room' },
          { time: '19:45', title: 'The Node Runtime is Changing', speaker: 'Nora Blake', room: 'Main Room' },
          { time: '20:30', title: 'Networking + Drinks', room: 'Bar' },
        ] },
      ],
    },
    {
      title: 'Startup Pitch Night',
      slug: 'startup-pitch-night',
      description: 'Five early-stage startups pitch to a panel of investors and mentors. Networking reception follows.',
      startsAt: new Date('2026-08-25T19:00:00Z'),
      endsAt: new Date('2026-08-25T22:00:00Z'),
      venue: 'The Battery',
      location: 'San Francisco, CA',
      status: 'published',
      maxAttendees: 120,
      organizer: organizer.id,
      speakers: [
        { name: 'Elena Vasquez', title: 'Partner, Sequoia', bio: 'Seed-stage investor focused on infrastructure and dev tools.', avatar: 'E' },
        { name: 'Rob Watanabe', title: 'Founder, ShipIt', bio: 'Second-time founder, YC W22. Passionate about product-market fit at seed.', avatar: 'R' },
      ],
      schedule: [
        { day: 'Aug 25', items: [
          { time: '19:00', title: 'Welcome + Format', room: 'Main Hall' },
          { time: '19:15', title: 'Pitches (5 startups × 5 min + Q&A)', room: 'Main Hall' },
          { time: '20:45', title: 'Judges Deliberate + Q&A with Panel', room: 'Main Hall' },
          { time: '21:15', title: 'Winner Announced + Reception', room: 'Rooftop' },
        ] },
      ],
    },
    {
      title: 'Design Workshop (Draft)',
      slug: 'design-workshop-draft',
      description: 'An intensive workshop on design systems and component libraries. Still planning the agenda.',
      startsAt: new Date('2026-10-05T10:00:00Z'),
      endsAt: new Date('2026-10-05T16:00:00Z'),
      venue: 'TBD',
      location: 'San Francisco, CA',
      status: 'draft',
      organizer: organizer.id,
    },
  ]

  const createdEvents = []
  for (const e of events) {
    const existing = await Event.where('slug', e.slug).first()
    if (existing) {
      createdEvents.push(existing)
    } else {
      const created = await Event.create(e)
      createdEvents.push(created)
    }
  }

  const ticketTypes = [
    { name: 'Early Bird', description: 'Discounted early registration', price: 149.00, quantity: 100, sold: 42, event: createdEvents[0].id },
    { name: 'General Admission', description: 'Standard conference pass', price: 249.00, quantity: 300, sold: 87, event: createdEvents[0].id },
    { name: 'VIP', description: 'Front-row seating, speaker dinner, and swag bag', price: 499.00, quantity: 50, sold: 12, event: createdEvents[0].id },
    { name: 'Free', description: 'Free community event', price: 0.00, quantity: 80, sold: 35, event: createdEvents[1].id },
    { name: 'General', description: 'Standard admission', price: 25.00, quantity: 100, sold: 28, event: createdEvents[2].id },
    { name: 'VIP Table', description: 'Reserved seating with investors', price: 150.00, quantity: 20, sold: 8, event: createdEvents[2].id },
  ]

  const createdTicketTypes = []
  for (const tt of ticketTypes) {
    const existing = await TicketType.where('name', tt.name).where('event_id', tt.event).first()
    if (existing) {
      createdTicketTypes.push(existing)
    } else {
      const created = await TicketType.create(tt)
      createdTicketTypes.push(created)
    }
  }

  const orders = [
    // Alice's own order: bought 3 GA tickets for Tech Conference.
    // She'll assign one to herself; the other two will start unassigned.
    { orderNumber: 'ORD-A1B2C3D4', email: 'alice@example.com', name: 'Alice Johnson', status: 'confirmed', paymentStatus: 'paid', subtotal: 747.00, discount: 0, total: 747.00, event: createdEvents[0].id },
    // Bob's order: 2 GA tickets. He reassigned one of them to Alice.
    { orderNumber: 'ORD-E5F6G7H8', email: 'bob@example.com', name: 'Bob Smith', status: 'confirmed', paymentStatus: 'paid', subtotal: 498.00, discount: 49.80, total: 448.20, event: createdEvents[0].id },
    // Carol's order.
    { orderNumber: 'ORD-I9J0K1L2', email: 'carol@example.com', name: 'Carol Davis', status: 'pending', paymentStatus: 'unpaid', subtotal: 25.00, discount: 0, total: 25.00, event: createdEvents[2].id },
    // Alice's second order: a free JS Meetup ticket.
    { orderNumber: 'ORD-ALICE-MEETUP', email: 'alice@example.com', name: 'Alice Johnson', status: 'confirmed', paymentStatus: 'paid', subtotal: 0, discount: 0, total: 0, event: createdEvents[1].id },
    // Alice's third order: 1 Startup Pitch Night ticket.
    { orderNumber: 'ORD-ALICE-PITCH', email: 'alice@example.com', name: 'Alice Johnson', status: 'confirmed', paymentStatus: 'paid', subtotal: 25.00, discount: 0, total: 25.00, event: createdEvents[2].id },
  ]

  const createdOrders = []
  for (const o of orders) {
    const existing = await Order.where('orderNumber', o.orderNumber).first()
    if (existing) {
      createdOrders.push(existing)
    } else {
      const created = await Order.create(o)
      createdOrders.push(created)
    }
  }

  const attendees = [
    // Alice's Tech Conference order: 1 assigned to her, 2 still unassigned (name=null).
    { name: 'Alice Johnson', email: 'alice@example.com', ticketCode: 'TK-ALICE-TC01', order: createdOrders[0].id, ticketType: createdTicketTypes[1].id, event: createdEvents[0].id, checkedInAt: null },
    { name: null,            email: 'alice@example.com', ticketCode: 'TK-ALICE-TC02', order: createdOrders[0].id, ticketType: createdTicketTypes[1].id, event: createdEvents[0].id, checkedInAt: null },
    { name: null,            email: 'alice@example.com', ticketCode: 'TK-ALICE-TC03', order: createdOrders[0].id, ticketType: createdTicketTypes[1].id, event: createdEvents[0].id, checkedInAt: null },

    // Bob's Tech Conference order: kept one, reassigned the second to Alice.
    { name: 'Bob Smith',     email: 'bob@example.com',   ticketCode: 'TK-BOB-TC01',   order: createdOrders[1].id, ticketType: createdTicketTypes[1].id, event: createdEvents[0].id, checkedInAt: new Date('2026-09-15T08:45:00Z') },
    { name: 'Alice Johnson', email: 'alice@example.com', ticketCode: 'TK-BOB-TC02',   order: createdOrders[1].id, ticketType: createdTicketTypes[1].id, event: createdEvents[0].id, checkedInAt: null },

    // Carol's order.
    { name: 'Carol Davis',   email: 'carol@example.com', ticketCode: 'TK-CAROL-01',   order: createdOrders[2].id, ticketType: createdTicketTypes[4].id, event: createdEvents[2].id, checkedInAt: null },

    // Alice's JS Meetup free ticket (assigned to her).
    { name: 'Alice Johnson', email: 'alice@example.com', ticketCode: 'TK-ALICE-JSM1', order: createdOrders[3].id, ticketType: createdTicketTypes[3].id, event: createdEvents[1].id, checkedInAt: null },

    // Alice's Startup Pitch Night ticket (assigned to her).
    { name: 'Alice Johnson', email: 'alice@example.com', ticketCode: 'TK-ALICE-SP01', order: createdOrders[4].id, ticketType: createdTicketTypes[4].id, event: createdEvents[2].id, checkedInAt: null },
  ]

  for (const a of attendees) {
    const existing = await Attendee.where('ticketCode', a.ticketCode).first()
    if (!existing) {
      await Attendee.create(a)
    }
  }

  const discountCodes = [
    { code: 'EARLY20', type: 'percentage', value: 20, maxUses: 50, usedCount: 12, expiresAt: new Date('2026-08-31T23:59:59Z'), event: createdEvents[0].id },
    { code: 'SPEAKER50', type: 'fixed', value: 50, maxUses: 10, usedCount: 3, expiresAt: null, event: createdEvents[0].id },
    { code: 'WELCOME10', type: 'percentage', value: 10, maxUses: null, usedCount: 0, expiresAt: new Date('2026-12-31T23:59:59Z'), event: createdEvents[2].id },
  ]

  for (const dc of discountCodes) {
    const existing = await DiscountCode.where('code', dc.code).where('event_id', dc.event).first()
    if (!existing) {
      await DiscountCode.create(dc)
    }
  }

  console.log(`Seeded ${createdEvents.length} events, ${createdTicketTypes.length} ticket types, ${createdOrders.length} orders, ${attendees.length} attendees, ${discountCodes.length} discount codes`)
}
