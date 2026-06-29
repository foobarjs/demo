export default function schedule(run) {
  run.daily('SendOrderReceipt', {
    email: 'ops@example.com',
    orderId: 0,
    number: 'daily-summary',
    total: 0,
  });
}
