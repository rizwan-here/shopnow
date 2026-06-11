import mongoose, { Schema } from 'mongoose';

const StoreLinkSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    storeSlug: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.models.StoreLink || mongoose.model('StoreLink', StoreLinkSchema);
