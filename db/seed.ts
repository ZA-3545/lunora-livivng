import { loadLocalEnv } from "./env";
import { bundleItems, bundles, categories, products } from "../lib/mock-products";
import { closePool, getPool } from "../lib/db/pool";

async function main() {
  loadLocalEnv();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const category of categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, image)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           image = EXCLUDED.image`,
        [
          category.id,
          category.name,
          category.slug,
          category.description,
          category.image,
        ],
      );
    }

    for (const product of products) {
      await client.query(
        `INSERT INTO products (
           id, name, slug, description, short_description, category_id,
           price, cost_price, stock_qty, weight, images, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           short_description = EXCLUDED.short_description,
           category_id = EXCLUDED.category_id,
           price = EXCLUDED.price,
           cost_price = EXCLUDED.cost_price,
           stock_qty = EXCLUDED.stock_qty,
           weight = EXCLUDED.weight,
           images = EXCLUDED.images,
           status = EXCLUDED.status`,
        [
          product.id,
          product.name,
          product.slug,
          product.description,
          product.shortDescription,
          product.categoryId,
          product.price,
          product.costPrice,
          product.stockQty,
          product.weight,
          product.images,
          product.status,
        ],
      );
    }

    for (const bundle of bundles) {
      await client.query(
        `INSERT INTO bundles (id, name, slug, description, bundle_price, image)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           bundle_price = EXCLUDED.bundle_price,
           image = EXCLUDED.image`,
        [
          bundle.id,
          bundle.name,
          bundle.slug,
          bundle.description,
          bundle.bundlePrice,
          bundle.image,
        ],
      );
    }

    await client.query("DELETE FROM bundle_items");
    for (const item of bundleItems) {
      await client.query(
        `INSERT INTO bundle_items (id, bundle_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [item.id, item.bundleId, item.productId, item.quantity],
      );
    }

    await client.query("COMMIT");
    console.log(
      `seeded ${categories.length} categories, ${products.length} products, ${bundles.length} bundles, ${bundleItems.length} bundle items`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .then(async () => {
    await closePool();
  })
  .catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });
