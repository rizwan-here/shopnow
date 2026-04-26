import { currency } from '@/lib/utils';

const BANGLA_REGEX = /[\u0980-\u09FF]/;
const ROMANIZED_BANGLA_TERMS = [
  'daam', 'dam', 'koto', 'kotodin', 'kotodin', 'lagbe', 'paben', 'pabo', 'asen', 'hobe', 'ache', 'ase',
  'size', 'mape', 'lomba', 'lombay', 'chest', 'kombe', 'discount', 'offer', 'change', 'bodol', 'ferot',
  'returnable', 'changable', 'delivery', 'payment', 'bkash', 'bikash', 'nagad', 'pp', 'vai', 'apu', 'bhai', 'apa'
];

const STORE_POLICIES = {
  payment: 'Cash on delivery only. No bKash, Nagad, card, or online gateway is enabled right now.',
  delivery: 'Usually 2-5 working days inside major cities and 3-7 working days in other areas, depending on courier load and location.',
  discount: 'No automatic discount is configured in the store right now unless a campaign is clearly mentioned on the product or storefront.',
  returns: 'Exchange/change can be requested for genuine issues or wrong delivery. The customer should contact support quickly after delivery and keep the item unused with original packaging.'
};

export function detectLanguageMode(input = '') {
  const text = String(input || '').trim();
  if (!text) return 'english';
  if (BANGLA_REGEX.test(text)) return 'bangla';

  const normalized = text.toLowerCase();
  const hitCount = ROMANIZED_BANGLA_TERMS.filter((term) => normalized.includes(term)).length;
  const words = normalized.split(/\s+/).filter(Boolean);

  if (hitCount >= 1 && words.length <= 20) return 'bangla_romanized';
  if (/(koto|lagbe|jabe|ache|hobe|koren|kora|niben|paben|lomba|daam|dam|bodol)/.test(normalized)) {
    return 'bangla_romanized';
  }

  return 'english';
}

export function buildProductSummary(products = [], categories = []) {
  const categoriesById = Object.fromEntries(categories.map((category) => [String(category._id), category.name]));

  return products.slice(0, 18).map((product) => {
    const categoryNames = (product.categoryIds || [])
      .map((categoryId) => categoriesById[String(categoryId)])
      .filter(Boolean)
      .join(', ');

    return {
      name: product.name,
      price: currency(product.price),
      description: product.description || 'No extra description added yet.',
      categories: categoryNames || 'Uncategorized'
    };
  });
}

export function buildChatSystemPrompt({ storeData, languageMode }) {
  const productSummary = buildProductSummary(storeData.products, storeData.categories)
    .map((product) => `- ${product.name} | ${product.price} | ${product.categories} | ${product.description}`)
    .join('\n');

  const languageInstruction = {
    english: 'Reply in natural English. Sound like a helpful real sales assistant, not a bot. Keep it warm, brief, and specific.',
    bangla: 'বাংলায় উত্তর দাও, স্বাভাবিক মানুষের মতো। খুব রোবটিক বা টেমপ্লেটের মতো শোনাবে না।',
    bangla_romanized: 'Bangla ke English alphabets e likhe reply dao. Natural vabe kotha bolo, jeno real seller support. Bangla script use korbe na.'
  }[languageMode] || 'Reply in natural English.';

  return `You are the live sales and support assistant for an online fashion store named ${storeData.profile.storeName}.

Your job:
- Answer like a real, friendly human seller.
- Understand English, Bangla, and Bangla typed with English letters.
- Handle spelling mistakes, shorthand, local phrases, and mixed-language queries.
- If the customer writes in English, reply in English.
- If the customer writes in Bangla script, reply in Bangla script.
- If the customer writes Bangla in English letters, reply in Bangla written with English letters.
- Keep answers conversational, fluent, and helpful. Do not sound canned.
- Mention only facts you know from the provided store context and policies.
- If some information is missing, say that honestly and offer the closest helpful answer.
- Never say online payment is available.
- Never mention that you are using a model, prompt, API, tool, or hidden context.

Store facts:
- Store name: ${storeData.profile.storeName}
- Store bio: ${storeData.profile.bio}
- Payment policy: ${STORE_POLICIES.payment}
- Delivery policy: ${STORE_POLICIES.delivery}
- Discount policy: ${STORE_POLICIES.discount}
- Return/change policy: ${STORE_POLICIES.returns}

Available products:
${productSummary || '- No products found.'}

Guidance for customer questions:
- For price questions, mention the product price clearly.
- For delivery questions, use the delivery policy.
- For payment questions, say cash on delivery only.
- For size or measurement questions, use product descriptions if present. If the product description does not include enough measurement details, say that the exact size chart is not added yet.
- For discount questions, do not invent offers.
- For return/change questions, use the return/change policy.
- If the customer refers to a product vaguely, infer the likely product from the conversation when reasonable.
- Prefer short paragraphs or 2-4 sentences. Avoid bullet points unless absolutely needed.

Response style:
${languageInstruction}`;
}

function localizeText(languageMode, english, bangla, romanizedBangla) {
  if (languageMode === 'bangla') return bangla;
  if (languageMode === 'bangla_romanized') return romanizedBangla;
  return english;
}

function matchProductFromText(text, products = []) {
  const lowered = String(text || '').toLowerCase();
  return products.find((product) => lowered.includes(String(product.name || '').toLowerCase()));
}

export function fallbackSupportReply({ userMessage, storeData, history = [] }) {
  const languageMode = detectLanguageMode(userMessage);
  const lowered = String(userMessage || '').toLowerCase();
  const recentProduct = matchProductFromText(userMessage, storeData.products)
    || [...history].reverse().map((item) => matchProductFromText(item.content, storeData.products)).find(Boolean)
    || storeData.products[0]
    || null;

  const has = (...terms) => terms.some((term) => lowered.includes(term));

  if (has('hello', 'hi', 'hey', 'assalamu', 'salam', 'আসসালামু', 'হ্যালো')) {
    return localizeText(
      languageMode,
      `Hello! I'm here to help with price, size, delivery time, COD payment, discount, or return/change questions. If you want, you can also send the product name.`,
      `হ্যালো! আমি প্রাইস, সাইজ, ডেলিভারি টাইম, ক্যাশ অন ডেলিভারি, ডিসকাউন্ট আর রিটার্ন/চেঞ্জ নিয়ে সাহায্য করতে পারি। চাইলে প্রোডাক্টের নামও লিখে দিতে পারেন।`,
      `Hello! Ami price, size, delivery time, cash on delivery, discount ar return/change niye help korte pari. Chaile product er naam o likhe dite paren.`
    );
  }

  if (has('payment', 'cod', 'cash', 'bkash', 'bikash', 'nagad', 'card', 'পেমেন্ট', 'ক্যাশ')) {
    return localizeText(languageMode, STORE_POLICIES.payment, 'পেমেন্ট মেথড এখন শুধু ক্যাশ অন ডেলিভারি। bKash, Nagad, card বা অন্য কোনো online gateway এখন চালু নেই।', `Payment method ekhon shudhu Cash on delivery. bKash, Nagad, card ba online gateway active nai.`);
  }

  if (has('price', 'prize', 'pp', 'daam', 'dam', 'koto', 'tk', 'taka', 'দাম', 'প্রাইজ') && recentProduct) {
    return localizeText(
      languageMode,
      `${recentProduct.name} is ${currency(recentProduct.price)} right now. If you want, I can also help with size, delivery time, or exchange details for this item.`,
      `${recentProduct.name} এর দাম এখন ${currency(recentProduct.price)}। চাইলে এই আইটেমের সাইজ, ডেলিভারি টাইম বা এক্সচেঞ্জ নিয়েও বলতে পারি।`,
      `${recentProduct.name} er daam ekhon ${currency(recentProduct.price)}. Chaile ei item er size, delivery time ba exchange niyeo bolte pari.`
    );
  }

  if (has('size', 'measurement', 'length', 'lomba', 'lombay', 'chest', 'waist', 'fit', 'সাইজ', 'মাপ')) {
    const details = recentProduct?.description?.trim();
    if (details && details.length > 10) {
      return localizeText(
        languageMode,
        `For ${recentProduct.name}, the description says: ${details}. If you need exact body measurements like chest, waist, or length, those are not fully added yet unless mentioned there.`,
        `${recentProduct.name} এর ডিসক্রিপশনে আছে: ${details}। তবে চেস্ট, ওয়েস্ট বা লেংথের এক্স্যাক্ট মাপ সেখানে না থাকলে এখনও আলাদা সাইজ চার্ট যোগ করা হয়নি।`,
        `${recentProduct.name} er description e ache: ${details}. Tobe chest, waist ba length er exact map okhane na thakle alada size chart ekhono add kora hoyni.`
      );
    }

    return localizeText(
      languageMode,
      `The exact size chart is not added yet for this item. If you want, message the seller for chest, waist, length, or fit details before placing the order.`,
      `এই আইটেমের এক্স্যাক্ট সাইজ চার্ট এখনও যোগ করা হয়নি। চাইলে অর্ডার দেওয়ার আগে সেলারকে চেস্ট, ওয়েস্ট, লেংথ বা ফিট ডিটেইলস জিজ্ঞেস করতে পারেন।`,
      `Ei item er exact size chart ekhono add kora hoyni. Chaile order deyar age seller ke chest, waist, length ba fit details jiggesh korte paren.`
    );
  }

  if (has('discount', 'offer', 'sale', 'off', 'কম', 'ডিসকাউন্ট')) {
    return localizeText(languageMode, STORE_POLICIES.discount, `এখন স্টোরে কোনো অটো ডিসকাউন্ট সেট করা নেই। যদি বিশেষ অফার থাকে, সেটা প্রোডাক্ট বা স্টোর পেজে উল্লেখ থাকবে।`, `Ekhon store e kono auto discount set kora nei. Jodi special offer thake, seta product ba store page e mention thakbe.`);
  }

  if (has('delivery', 'shipping', 'receive', 'lagbe', 'kotodin', 'asbe', 'পেতে', 'কতদিন', 'ডেলিভারি')) {
    return localizeText(languageMode, STORE_POLICIES.delivery, `ডেলিভারি সাধারণত বড় শহরে ২-৫ কর্মদিবস আর অন্য জায়গায় ৩-৭ কর্মদিবস লাগে। লোকেশন আর কুরিয়ার লোডের ওপর একটু কম-বেশি হতে পারে।`, `Delivery shadharonoto boro shahore 2-5 working days ar onno jaygay 3-7 working days lage. Location ar courier load er upor ektu kom-beshi hote pare.`);
  }

  if (has('return', 'change', 'exchange', 'replace', ' ফেরত', 'চেঞ্জ', 'বদল', 'জাবে', 'jabe')) {
    return localizeText(languageMode, STORE_POLICIES.returns, `রিটার্ন/চেঞ্জ সাধারণত জেনুইন সমস্যা বা ভুল আইটেম গেলে করা যায়। পণ্য পাওয়ার পর দ্রুত জানাতে হবে, আর আইটেম আনইউজড ও অরিজিনাল প্যাকেজিংসহ রাখতে হবে।`, `Return/change shadharonoto genuine shomossha ba vul item gele kora jay. Ponno pawar por druto janate hobe, ar item unused o original packaging shoho rakhte hobe.`);
  }

  return localizeText(
    languageMode,
    `Of course — I can help with product price, size, delivery time, COD payment, discount, or return/change. Just send the product name too if you want a more exact answer.`,
    `অবশ্যই — আমি প্রোডাক্টের দাম, সাইজ, ডেলিভারি টাইম, ক্যাশ অন ডেলিভারি, ডিসকাউন্ট বা রিটার্ন/চেঞ্জ নিয়ে সাহায্য করতে পারি। আরও এক্স্যাক্ট উত্তর চাইলে প্রোডাক্টের নামও লিখে দিন।`,
    `Obosshoi — ami product er daam, size, delivery time, cash on delivery, discount ba return/change niye help korte pari. Aro exact answer chaile product er naam o likhe din.`
  );
}
