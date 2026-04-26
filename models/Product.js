import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, default: 1, min: 0 },
    stockStatus: { type: String, enum: ['in_stock', 'low_stock', 'stock_out'], default: 'in_stock' },
    featured: { type: Boolean, default: false },
    sizeOptions: { type: [String], default: [] },
    colorOptions: { type: [String], default: [] },
    varieties: {
      type: [
        {
          name: { type: String, default: '' },
          imageUrl: { type: String, default: '' }
        }
      ],
      default: []
    },
    measurements: {
      length: { type: String, default: '' },
      chest: { type: String, default: '' },
      waist: { type: String, default: '' },
      fabric: { type: String, default: '' },
      fitNote: { type: String, default: '' }
    },
    deliveryEstimate: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
    storeSlug: { type: String, required: true, trim: true, index: true },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
  },
  { timestamps: true }
);

ProductSchema.index({ storeSlug: 1, slug: 1 }, { unique: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
