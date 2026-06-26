import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    ownerId:         { type: String, required: true, unique: true, index: true },
    ownerEmail:      { type: String, default: '' },
    plan:            { type: String, enum: ['free', 'pro'], default: 'free' },
    // Manual activation fields (no payment gateway — admin confirms payment)
    proActivatedAt:  { type: Date, default: null },
    proExpiresAt:    { type: Date, default: null },
    paymentRef:      { type: String, default: '' },   // bKash/Nagad tx id entered by seller
    paymentNote:     { type: String, default: '' },
    // AdSense config stored per-store
    adsensePublisherId: { type: String, default: '' }, // ca-pub-XXXXXXXXXXXXXXXX
    adsenseBannerSlot:  { type: String, default: '' }, // slot id for below-banner ad
    adsenseGridSlot:    { type: String, default: '' }, // slot id for in-grid ad
    adsEnabled:         { type: Boolean, default: true }, // admin can kill ads globally
  },
  { timestamps: true }
);

// Virtual: is the pro subscription currently active?
SubscriptionSchema.virtual('isProActive').get(function () {
  if (this.plan !== 'pro') return false;
  if (!this.proExpiresAt) return false;
  return new Date() < new Date(this.proExpiresAt);
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
