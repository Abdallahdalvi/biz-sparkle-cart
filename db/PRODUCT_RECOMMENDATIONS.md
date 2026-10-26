Apply `0003_product_engagement.sql` to the existing database before deploying this change, then reload the PostgREST schema cache (included in the migration).

The homepage offers Recommended, Newly Added, and Most Popular phone lists. The catalog defaults to Recommended and retains explicit price sorting. Newly Added uses the database creation timestamp. Recommended uses weighted random sampling, stable during a page visit; popularity favors views, product-card clicks, and add-to-cart intent. Available products come first except when explicitly browsing newest or price order. Price and manually curated CMS product order do not influence recommendations.

Engagement is collected only with analytics consent, without depending on Google or Meta being enabled. Each session contributes at most one event of each kind per product per day. The RPC stores a daily hash of a random session identifier and exposes only product aggregates. Events expire after 30 days and lose half their ranking weight every seven days. Cart additions carry more weight than clicks or views; logarithmic scaling and a smoothed cart rate limit the influence of small samples. This is an engagement heuristic, not a trained purchase prediction model.

When no signals exist (or the migration has not yet been applied), recommendations use a varied mix with a modest freshness boost. The collection still loads if engagement is unavailable. Live popularity starts accumulating after deployment and migration; existing third-party analytics are not imported.

Verify with `npm run test:recommendations` and `npm run build`. After applying the migration, accept analytics consent, open a product from its card, and add it to cart. `get_product_engagement()` should report the three signals once; refresh and repeat within that session to confirm deduplication. Declining analytics must produce no engagement writes. Public clients must not be able to select the underlying event table.

Anonymous event RPCs are intended as approximate merchandising signals. They are not a fraud-resistant source of sales data; production gateway rate limits should apply to them alongside other public endpoints.
