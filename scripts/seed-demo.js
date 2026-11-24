// scripts/seed-demo.js
// Seeds demo collections, products, reviews and discount codes.
// Safe to run more than once: products/collections are upserted by slug,
// demo reviews are replaced, and ratings are recalculated.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connect } from "../lib/mongoose.js";
import { Product } from "../lib/models/Product.js";
import { Collection } from "../lib/models/Collection.js";
import { Review } from "../lib/models/Review.js";
import { Discount } from "../lib/models/Discount.js";

// Load .env.local (same approach as seed-admin.js).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(process.cwd(), ".env.local"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...val] = trimmed.split("=");
        if (key && val.length && !process.env[key.trim()]) {
          process.env[key.trim()] = val.join("=").trim();
        }
      }
    }
    break;
  }
}

const rupees = (value) => Math.round(Number(value) * 100);
const DEMO_REVIEW_EMAIL = "demo@octagonetoys.com";

const collectionsSeed = [
  {
    slug: "building-blocks",
    name: "Building Blocks",
    description:
      "Stack, sort and build. Open-ended construction sets that grow with your child and spark problem-solving from the very first tower.",
    image: "/demo/blocks.jpg",
    position: 1,
    isFeatured: true,
  },
  {
    slug: "remote-control",
    name: "Remote Control",
    description:
      "Fast, sturdy and easy to drive. RC cars and stunt vehicles for kids who love a little speed and a lot of giggles.",
    image: "/demo/rc-car.jpg",
    position: 2,
    isFeatured: true,
  },
  {
    slug: "plush-and-cuddly",
    name: "Plush & Cuddly",
    description:
      "Soft, huggable friends made from child-safe fabrics. Perfect for bedtime, quiet time and everything in between.",
    image: "/demo/plush-bear.jpg",
    position: 3,
    isFeatured: true,
  },
  {
    slug: "puzzles-and-games",
    name: "Puzzles & Games",
    description:
      "Screen-free family fun. Chunky first puzzles and quick-play games that build focus, patience and conversation.",
    image: "/demo/puzzle.jpg",
    position: 4,
    isFeatured: false,
  },
  {
    slug: "space-and-science",
    name: "Space & Science",
    description:
      "Rockets, experiments and curious questions. Hands-on kits for budding astronauts, engineers and scientists.",
    image: "/demo/rocket.jpg",
    position: 5,
    isFeatured: true,
  },
  {
    slug: "arts-and-crafts",
    name: "Arts & Crafts",
    description:
      "Paint, draw, glue and create. Mess-friendly art supplies that turn a rainy afternoon into a masterpiece.",
    image: "/demo/art-set.jpg",
    position: 6,
    isFeatured: false,
  },
];

const productsSeed = [
  {
    slug: "rainbow-wooden-blocks-40-piece",
    name: "Rainbow Wooden Blocks (40 pieces)",
    sku: "TOY-1001",
    shortDescription: "A bright 40-piece wooden set for early builders and future architects.",
    description:
      "Smooth, chunky wooden blocks in six rainbow colours. Includes cubes, columns, arches and triangles for endless open-ended play.\n\n- 40 solid wood pieces\n- Non-toxic, water-based paint\n- Rounded edges for safe play\n- Recommended for ages 2+\n- Cotton storage bag included",
    price: rupees(2499),
    salePrice: rupees(1999),
    stock: 34,
    lowStockThreshold: 8,
    isFeatured: true,
    tags: ["wooden", "ages 2-4", "building", "gift"],
    image: "/demo/blocks.jpg",
    collections: ["building-blocks"],
  },
  {
    slug: "turbo-stunt-rc-car",
    name: "Turbo Stunt RC Car",
    sku: "TOY-1002",
    shortDescription: "A rechargeable stunt car that flips, spins and races across any floor.",
    description:
      "Double-sided stunt tyres let this RC car keep driving even after a flip. The 2.4GHz remote avoids interference, so several cars can race at once.\n\n- 2.4GHz remote control\n- USB rechargeable battery\n- 25–30 minutes run time\n- Suitable for ages 6+\n- Batteries for the remote included",
    price: rupees(4299),
    salePrice: rupees(3499),
    stock: 18,
    lowStockThreshold: 5,
    isFeatured: true,
    tags: ["rc", "ages 6+", "outdoor", "gift"],
    image: "/demo/rc-car.jpg",
    collections: ["remote-control"],
  },
  {
    slug: "cuddle-buddy-teddy-bear",
    name: "Cuddle Buddy Teddy Bear",
    sku: "TOY-1003",
    shortDescription: "A supersoft 45cm teddy with embroidered eyes and a weighted bottom.",
    description:
      "Made for hugs. This 45cm teddy uses short-pile plush fabric and embroidered eyes, so there are no small parts to worry about. The weighted base helps it sit upright on shelves and beds.\n\n- 45cm tall\n- Machine washable cover\n- Hypoallergenic filling\n- Embroidered eyes\n- Suitable from birth",
    price: rupees(2999),
    salePrice: null,
    stock: 41,
    lowStockThreshold: 10,
    isFeatured: true,
    tags: ["plush", "baby", "gift", "bedtime"],
    image: "/demo/plush-bear.jpg",
    collections: ["plush-and-cuddly"],
  },
  {
    slug: "first-animals-chunky-puzzle",
    name: "First Animals Chunky Puzzle",
    sku: "TOY-1004",
    shortDescription: "A 9-piece wooden puzzle with chunky animal pieces sized for little hands.",
    description:
      "Each chunky piece is easy for toddlers to grip and place. Beneath every piece is a matching picture, which helps children self-correct while they learn animal names and sounds.\n\n- 9 wooden animal pieces\n- Chunky 2cm thickness\n- Matching picture under each piece\n- Recommended for ages 18 months+\n- Wipe-clean surface",
    price: rupees(1499),
    salePrice: rupees(1199),
    stock: 52,
    lowStockThreshold: 10,
    isFeatured: false,
    tags: ["puzzle", "toddler", "wooden", "ages 1-3"],
    image: "/demo/puzzle.jpg",
    collections: ["puzzles-and-games"],
  },
  {
    slug: "mission-space-rocket-set",
    name: "Mission Space Rocket Set",
    sku: "TOY-1005",
    shortDescription: "A buildable rocket with an astronaut, rover and glow-in-the-dark stickers.",
    description:
      "Blast off with a 68-piece rocket set. The pieces click together without tools, and the set includes an astronaut figure, a mini rover and a sheet of glow-in-the-dark mission stickers.\n\n- 68 buildable pieces\n- Astronaut and rover included\n- Glow-in-the-dark stickers\n- Build guide with three designs\n- Suitable for ages 5+",
    price: rupees(3499),
    salePrice: rupees(2899),
    stock: 12,
    lowStockThreshold: 6,
    isFeatured: true,
    tags: ["space", "building", "ages 5+", "stem"],
    image: "/demo/rocket.jpg",
    collections: ["space-and-science", "building-blocks"],
  },
  {
    slug: "little-scientist-lab-kit",
    name: "Little Scientist Lab Kit",
    sku: "TOY-1006",
    shortDescription: "12 safe, mess-controlled experiments with everything you need in one box.",
    description:
      "A gentle introduction to chemistry and physics. Each experiment uses household-safe materials, and the illustrated booklet explains the science in kid-friendly language.\n\n- 12 guided experiments\n- Safety goggles and test tubes\n- Illustrated 32-page booklet\n- Adult supervision recommended\n- Suitable for ages 7+",
    price: rupees(3899),
    salePrice: null,
    stock: 9,
    lowStockThreshold: 5,
    isFeatured: false,
    tags: ["science", "stem", "ages 7+", "experiments"],
    image: "/demo/science-kit.jpg",
    collections: ["space-and-science"],
  },
  {
    slug: "deluxe-art-and-craft-case",
    name: "Deluxe Art & Craft Case",
    sku: "TOY-1007",
    shortDescription: "150+ art supplies in a tidy carry case, from crayons to washable markers.",
    description:
      "Everything a young artist needs in one organised case: crayons, coloured pencils, washable markers, watercolour paints, brushes, safety scissors, glue and paper.\n\n- 150+ pieces\n- Washable, non-toxic supplies\n- Folding carry case\n- Scissors with rounded tips\n- Suitable for ages 4+",
    price: rupees(3299),
    salePrice: rupees(2699),
    stock: 27,
    lowStockThreshold: 8,
    isFeatured: true,
    tags: ["art", "craft", "ages 4+", "gift"],
    image: "/demo/art-set.jpg",
    collections: ["arts-and-crafts"],
  },
  {
    slug: "dream-house-dollhouse",
    name: "Dream House Dollhouse",
    sku: "TOY-1008",
    shortDescription: "A two-storey wooden dollhouse with 18 furniture pieces and open sides.",
    description:
      "An open-sided wooden dollhouse that invites storytelling from every angle. Comes with 18 furniture pieces and a reversible roof panel for two different looks.\n\n- Two storeys with open sides\n- 18 wooden furniture pieces\n- Reversible roof panel\n- Easy assembly, tools included\n- Suitable for ages 3+",
    price: rupees(8999),
    salePrice: rupees(7499),
    stock: 6,
    lowStockThreshold: 4,
    isFeatured: false,
    tags: ["dollhouse", "pretend play", "ages 3+", "wooden"],
    image: "/demo/dollhouse.jpg",
    collections: ["building-blocks", "plush-and-cuddly"],
  },
];

const reviewsSeed = [
  { product: "rainbow-wooden-blocks-40-piece", authorName: "Ayesha K.", rating: 5, title: "Best purchase this year", comment: "The blocks are beautifully finished and my 3-year-old has not stopped building since they arrived. Delivery was quick too." },
  { product: "rainbow-wooden-blocks-40-piece", authorName: "Bilal R.", rating: 4, title: "Great quality", comment: "Solid wood and lovely colours. I wish the bag were a little bigger, but the blocks themselves are excellent." },
  { product: "turbo-stunt-rc-car", authorName: "Hamza S.", rating: 5, title: "Survives every crash", comment: "My son drives it into everything and it keeps going. Battery lasts longer than expected." },
  { product: "turbo-stunt-rc-car", authorName: "Sana M.", rating: 4, title: "Fun but loud", comment: "Really fun on tile floors. It is a bit noisy, so we keep it for outside play." },
  { product: "cuddle-buddy-teddy-bear", authorName: "Maryam T.", rating: 5, title: "So soft", comment: "Bought as a newborn gift and it looks even better in person. The weighted bottom is a nice touch." },
  { product: "first-animals-chunky-puzzle", authorName: "Usman A.", rating: 4, title: "Perfect for little hands", comment: "The pieces are chunky enough for my 20-month-old. The matching pictures underneath help a lot." },
  { product: "mission-space-rocket-set", authorName: "Zara H.", rating: 5, title: "My son is obsessed", comment: "The glow stickers are the highlight. Instructions were clear and we built it together in about 20 minutes." },
  { product: "little-scientist-lab-kit", authorName: "Faisal N.", rating: 4, title: "Good rainy-day kit", comment: "Experiments are simple and safe. We have done four so far and still have plenty left." },
  { product: "deluxe-art-and-craft-case", authorName: "Hina Q.", rating: 5, title: "Everything in one place", comment: "No more hunting for markers. The case keeps everything tidy and the supplies are genuinely washable." },
  { product: "dream-house-dollhouse", authorName: "Nadia I.", rating: 5, title: "Worth the price", comment: "Sturdy, spacious and lovely details. Assembly took 15 minutes and the instructions were easy to follow." },
];

const discountsSeed = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    discountType: "percentage",
    discountValue: 10,
    minSubtotal: 0,
    usageLimit: null,
  },
  {
    code: "TOYS500",
    description: "Rs 500 off orders over Rs 5,000",
    discountType: "fixed",
    discountValue: rupees(500),
    minSubtotal: rupees(5000),
    usageLimit: 200,
  },
];

async function recalculateRatings(productIds) {
  for (const productId of productIds) {
    const [result] = await Review.aggregate([
      { $match: { productId, isApproved: true, isDeleted: false } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          ratingAverage: result ? Math.round(result.average * 10) / 10 : 0,
          ratingCount: result?.count || 0,
        },
      }
    );
  }
}

async function seedDemo() {
  console.log("--- Starting demo data seeding ---");

  try {
    await connect();
    console.log("Connected to MongoDB");

    // 1. Collections
    const collectionDocs = new Map();
    for (const collection of collectionsSeed) {
      const doc = await Collection.findOneAndUpdate(
        { slug: collection.slug },
        {
          $set: {
            name: collection.name,
            slug: collection.slug,
            description: collection.description,
            image: collection.image,
            isActive: true,
            isFeatured: Boolean(collection.isFeatured),
            isDeleted: false,
            position: collection.position,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      collectionDocs.set(collection.slug, doc);
    }
    console.log(`Upserted ${collectionDocs.size} collections`);

    // 2. Products
    const productDocs = new Map();
    for (const product of productsSeed) {
      const collectionIds = product.collections
        .map((slug) => collectionDocs.get(slug)?._id)
        .filter(Boolean);

      const doc = await Product.findOneAndUpdate(
        { slug: product.slug },
        {
          $set: {
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            saleStart: null,
            saleEnd: null,
            images: [{ url: product.image, alt: product.name, publicId: "" }],
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold,
            isActive: true,
            isFeatured: Boolean(product.isFeatured),
            collectionIds,
            tags: product.tags,
            isDeleted: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      productDocs.set(product.slug, doc);
    }
    console.log(`Upserted ${productDocs.size} products`);

    // 3. Collection <-> product ordering
    for (const collection of collectionsSeed) {
      const doc = collectionDocs.get(collection.slug);
      const members = productsSeed.filter((product) =>
        product.collections.includes(collection.slug)
      );

      doc.products = members.map((product, index) => ({
        productId: productDocs.get(product.slug)._id,
        position: index,
      }));
      await doc.save();
    }
    console.log("Linked products to collections");

    // 4. Reviews (replace only the demo reviews, keep real customer ones)
    const demoProductIds = [...productDocs.values()].map((doc) => doc._id);
    await Review.deleteMany({
      productId: { $in: demoProductIds },
      authorEmail: DEMO_REVIEW_EMAIL,
    });

    const reviewDocs = reviewsSeed
      .map((review) => {
        const product = productDocs.get(review.product);
        if (!product) return null;
        return {
          productId: product._id,
          authorName: review.authorName,
          authorEmail: DEMO_REVIEW_EMAIL,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          isApproved: true,
          isDeleted: false,
        };
      })
      .filter(Boolean);

    await Review.insertMany(reviewDocs);
    await recalculateRatings(demoProductIds);
    console.log(`Inserted ${reviewDocs.length} approved reviews and recalculated ratings`);

    // 5. Discounts
    for (const discount of discountsSeed) {
      await Discount.findOneAndUpdate(
        { code: discount.code },
        {
          $set: {
            description: discount.description,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            minSubtotal: discount.minSubtotal,
            startsAt: null,
            endsAt: null,
            usageLimit: discount.usageLimit,
            isActive: true,
            isDeleted: false,
          },
          $setOnInsert: { usedCount: 0 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`Upserted ${discountsSeed.length} discount codes`);

    console.log("\nDemo data ready:");
    console.log("  Products:    " + productsSeed.length);
    console.log("  Collections: " + collectionsSeed.length);
    console.log("  Discounts:   " + discountsSeed.map((item) => item.code).join(", "));
    console.log("  Storefront:  http://localhost:3000");

    await mongoose.disconnect();
    console.log("\nDisconnected from database cleanly");
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedDemo();
