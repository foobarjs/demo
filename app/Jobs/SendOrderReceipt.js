import { job } from '@foobarjs/framework';

export default job('SendOrderReceipt', async (ctx, payload) => {
  const mailId = ctx.mail?.({
    to: payload.email,
    subject: `Receipt for ${payload.number}`,
    text: `Thanks for your order ${payload.number}. Total: $${payload.total}.`,
  });

  return {
    sent: true,
    mailId,
    email: payload.email,
    orderId: payload.orderId,
  };
});
