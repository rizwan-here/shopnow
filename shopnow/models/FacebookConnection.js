import mongoose, { Schema } from 'mongoose';

const FacebookPageSchema = new Schema(
  {
    pageId: { type: String, required: true },
    pageName: { type: String, required: true },
    accessToken: { type: String, required: true }
  },
  { _id: false }
);

const FacebookConnectionSchema = new Schema(
  {
    ownerId: { type: String, required: true, unique: true, index: true },
    pages: { type: [FacebookPageSchema], default: [] },
    selectedPageId: { type: String, default: '' },
    selectedPageName: { type: String, default: '' },
    connectedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.FacebookConnection || mongoose.model('FacebookConnection', FacebookConnectionSchema);
