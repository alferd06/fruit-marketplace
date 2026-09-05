const midtransClient = require('midtrans-client');
require('dotenv').config();

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

async function createQrisCharge(order, items) {
  const parameter = {
    payment_type: 'qris',
    transaction_details: {
      order_id: order.order_code,
      gross_amount: order.total_amount,
    },
    item_details: items.map((item) => ({
      id: item.product_id.toString(),
      price: item.price,
      quantity: item.quantity,
      name: item.product_name.substring(0, 50),
    })),
    customer_details: {
      first_name: order.buyer_name,
      phone: order.buyer_phone,
    },
    qris: {
      acquirer: 'gopay', // acquirer default sandbox
    },
  };

  const chargeResponse = await coreApi.charge(parameter);
  return chargeResponse;
  // berisi: transaction_id, order_id, transaction_status, expiry_time,
  // dan actions[] — salah satunya { name: 'generate-qr-code', url: '...' } = gambar QR
}

async function getTransactionStatus(orderCode) {
  const statusResponse = await coreApi.transaction.status(orderCode);
  return statusResponse;
}

module.exports = { createQrisCharge, getTransactionStatus };