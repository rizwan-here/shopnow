import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_CATEGORIES, DEFAULT_LINKS, DEFAULT_PRODUCTS, DEFAULT_PROFILE } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import Category from '@/models/Category';
import Product from '@/models/Product';
import StoreLink from '@/models/StoreLink';
import StoreProfile from '@/models/StoreProfile';

// This helper seeds the database only when it is empty. It makes the project
// usable immediately after `npm install` + `npm run dev`.
export async function ensureSeededStore() {
  await connectToDatabase();

  let profile = await StoreProfile.findOne({ slug: DEFAULT_PROFILE.slug });

  if (!profile) {
    profile = await StoreProfile.create(DEFAULT_PROFILE);
  }

  const existingCategories = await Category.find({ storeSlug: profile.slug });
  if (existingCategories.length === 0) {
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        slug: slugify(category.slug || category.name),
        storeSlug: profile.slug
      }))
    );
  }

  const categories = await Category.find({ storeSlug: profile.slug });
  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));

  const existingProducts = await Product.find({ storeSlug: profile.slug });
  if (existingProducts.length === 0) {
    await Product.insertMany(
      DEFAULT_PRODUCTS.map((product) => ({
        name: product.name,
        slug: slugify(product.slug || product.name),
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        storeSlug: profile.slug,
        categoryIds: product.categoryNames
          .map((name) => categoryMap.get(name))
          .filter(Boolean)
      }))
    );
  }

  const existingLinks = await StoreLink.find({ storeSlug: profile.slug });
  if (existingLinks.length === 0) {
    await StoreLink.insertMany(DEFAULT_LINKS.map((link) => ({ ...link, storeSlug: profile.slug })));
  }

  return profile;
}
