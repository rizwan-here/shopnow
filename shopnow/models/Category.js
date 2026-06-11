import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    storeSlug: { type: String, required: true, trim: true, index: true }
  },
  { timestamps: true }
);

CategorySchema.index({ storeSlug: 1, slug: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
