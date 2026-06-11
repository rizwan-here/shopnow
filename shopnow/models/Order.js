import mongoose, { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    selectedOptions: {
      size: { type: String, default: '' },
      color: { type: String, default: '' },
      varietyName: { type: String, default: '' }
    }
  },
  { _id: false }
);

const OrderEventSchema = new Schema(
  {
    action: { type: String, required: true },
    status: { type: String, required: true },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    storeSlug: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    address: { type: String, required: true },
    source: { type: String, default: 'Direct link' },
    buyerNote: { type: String, default: '' },
    sellerNote: { type: String, default: '' },
    sellerDeletedAt: { type: Date, default: null },
    sellerDeletedByAction: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['Cash on delivery'],
      default: 'Cash on delivery'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending'
    },
    total: { type: Number, required: true },
    items: [OrderItemSchema],
    timeline: {
      type: [OrderEventSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
