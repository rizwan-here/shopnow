import mongoose, { Schema } from 'mongoose';

const StoreProfileSchema = new Schema(
  {
    ownerId: { type: String, required: true, trim: true, unique: true, index: true },
    ownerEmail: { type: String, default: '', trim: true },
    ownerName: { type: String, default: '', trim: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    storeLogo: { type: String, default: '' },
    storeBanner: { type: String, default: '' },
    bio: { type: String, default: '' },
    instagramHandle: { type: String, default: '' },
    facebookHandle: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    messengerUrl: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    currencyCode: { type: String, default: 'BDT', trim: true },
    deliveryInsideDhaka: { type: Number, default: 80 },
    deliveryOutsideDhaka: { type: Number, default: 140 },
    freeDeliveryThreshold: { type: Number, default: 0 },
    defaultDeliveryEstimate: { type: String, default: '1-3 days inside Dhaka, 3-5 days outside Dhaka' },
    exchangePolicy: { type: String, default: 'Exchange available subject to seller approval. Please confirm before ordering.' },
    orderConfirmationTemplate: { type: String, default: 'Thanks! Your order is confirmed. We will contact you shortly for delivery details.' },
    deliveryUpdateTemplate: { type: String, default: 'Your order is packed and will be handed to the courier soon.' },
    outForDeliveryTemplate: { type: String, default: 'Your order is on the way. Please keep your phone available for delivery updates.' },
    paymentMethods: {
      type: [String],
      default: ['Cash on delivery']
    }
  },
  { timestamps: true }
);

export default mongoose.models.StoreProfile || mongoose.model('StoreProfile', StoreProfileSchema);
