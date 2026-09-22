import { readFile } from 'fs/promises';
import path from 'path';

const SITE_URL = 'https://adapools.xyz';
const SITEMAP_CACHE_MS = 15 * 60 * 1000;

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const trimDescription = (value, fallback) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
};

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(asNumber(value));
const formatAda = (lovelace) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(asNumber(lovelace) / 1_000_000)} ADA`;
const formatPercent = (value) => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(asNumber(value))}%`;

const poolStatus = (pool) => {
  const retiringEpoch = Number(pool.retiring_epoch);
  if (!Number.isFinite(retiringEpoch)) return 'Active';
  return retiringEpoch <= Number(pool.current_epoch || 0) ? 'Retired' : 'Retiring';
};

const isoDate = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const metaTag = (attribute, key, content) => (
  `<meta ${attribute}="${key}" content="${escapeHtml(content)}">`
);

const replaceMeta = (html, attribute, key, content) => {
  const expression = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, 'i');
  const tag = metaTag(attribute, key, content);
  return expression.test(html) ? html.replace(expression, tag) : html.replace('</head>', `  ${tag}\n</head>`);
};

const renderHtml = (template, { title, description, path: pagePath, image = '/social-card.png', jsonLd, noIndex = false, bodyHtml = '' }) => {
  const canonical = new URL(pagePath, SITE_URL).toString();
  const imageUrl = new URL(image, SITE_URL).toString();
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:image', imageUrl);
  html = replaceMeta(html, 'property', 'og:image:secure_url', imageUrl);
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);

  html = html.replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}">\n</head>`);

  if (noIndex) {
    html = html.replace('</head>', '  <meta name="robots" content="noindex, follow">\n</head>');
  }
  if (jsonLd) {
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    html = html.replace('</head>', `  <script id="page-json-ld" type="application/ld+json">${json}</script>\n</head>`);
  }
  if (bodyHtml) html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${bodyHtml}`);
  return html;
};

const poolSummaryData = (pool) => {
  const poolId = pool.bech32_pool_id;
  const label = pool.ticker || pool.name || poolId;
  return {
    poolId,
    ticker: pool.ticker || null,
    name: pool.name || null,
    description: pool.description || null,
    status: poolStatus(pool),
    active_stake_lovelace: pool.active_stake || pool.active_stake_lovelace || '0',
    delegators: asNumber(pool.delegators_numeric ?? pool.delegators),
    saturation_percent: asNumber(pool.pool_interest_numeric ?? pool.saturation_percent),
    total_blocks: asNumber(pool.blocks_numeric ?? pool.lifetime_blocks ?? pool.blocks),
    label
  };
};

const renderPoolSummary = (pool) => {
  const summary = poolSummaryData(pool);
  const snapshot = JSON.stringify(summary).replace(/</g, '\\u003c');
  return `<section class="pool-server-summary" data-pool-server-summary aria-labelledby="pool-server-summary-title">
  <div class="pool-server-summary-inner">
    <h1 id="pool-server-summary-title">${escapeHtml(summary.label)} Cardano Stake Pool</h1>
    <p>${escapeHtml(summary.description || `${summary.label} is an ${summary.status.toLowerCase()} Cardano stake pool.`)}</p>
    <dl class="pool-server-summary-metrics">
      <div><dt>Status</dt><dd>${escapeHtml(summary.status)}</dd></div>
      <div><dt>Active stake</dt><dd>${formatAda(summary.active_stake_lovelace)}</dd></div>
      <div><dt>Delegators</dt><dd>${formatNumber(summary.delegators)}</dd></div>
      <div><dt>Saturation</dt><dd>${formatPercent(summary.saturation_percent)}</dd></div>
      <div><dt>Total blocks</dt><dd>${formatNumber(summary.total_blocks)}</dd></div>
    </dl>
    <p class="pool-server-summary-id">Pool ID: <code>${escapeHtml(summary.poolId)}</code></p>
  </div>
</section>
<script>window.__ADAPOOLS_POOL_SEO__=${snapshot};</script>`;
};

const poolPageData = (pool) => {
  const label = pool.ticker || pool.name || pool.bech32_pool_id;
  const title = `${label} | Cardano Stake Pool | adapools.xyz`;
  const description = trimDescription(
    pool.description,
    `${label} is a Cardano stake pool. View stake, delegators, block history, costs and saturation on adapools.xyz.`
  );
  const poolId = pool.bech32_pool_id;
  return {
    title,
    description,
    path: `/pool/${encodeURIComponent(poolId)}`,
    image: pool.logo || '/social-card.png',
    bodyHtml: renderPoolSummary(pool),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: new URL(`/pool/${encodeURIComponent(poolId)}`, SITE_URL).toString(),
      about: {
        '@type': 'Thing',
        name: `${label} Cardano stake pool`
      }
    }
  };
};

const sitemapUrl = (loc, lastmod) => [
  '  <url>',
  `    <loc>${escapeHtml(loc)}</loc>`,
  lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
  '  </url>'
].filter(Boolean).join('\n');

export const registerSeoRoutes = async ({ app, collections, distDir }) => {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
  let sitemapCache = null;

  const sendPage = (res, data, status = 200) => {
    res.status(status).type('html').send(renderHtml(template, data));
  };

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const now = Date.now();
      if (!sitemapCache || now - sitemapCache.createdAt > SITEMAP_CACHE_MS) {
        const pools = await collections.poolCache.find(
          {
            bech32_pool_id: { $type: 'string' },
            blocks_numeric: { $gt: 0 },
            $or: [{ ticker: { $type: 'string' } }, { name: { $type: 'string' } }]
          },
          { projection: { _id: 0, bech32_pool_id: 1, synced_at: 1, updated_at: 1 } }
        ).sort({ bech32_pool_id: 1 }).toArray();

        const entries = [
          sitemapUrl(`${SITE_URL}/`),
          sitemapUrl(`${SITE_URL}/discover`),
          ...pools.map((pool) => sitemapUrl(
            `${SITE_URL}/pool/${encodeURIComponent(pool.bech32_pool_id)}`,
            isoDate(pool.synced_at || pool.updated_at)
          ))
        ];
        sitemapCache = {
          createdAt: now,
          xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
        };
      }
      res.type('application/xml').send(sitemapCache.xml);
    } catch (error) {
      console.error('[adapools] Failed to build sitemap:', error);
      res.status(503).type('text/plain').send('Sitemap temporarily unavailable');
    }
  });

  app.get('/', (req, res) => {
    sendPage(res, {
      title: 'adapools.xyz | Cardano Stake Pool Explorer',
      description: 'Real-time Cardano stake pool explorer: live block ticker, epoch progress and pool metrics for the Cardano mainnet, updated within seconds of each new block.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'adapools.xyz',
        url: `${SITE_URL}/`,
        description: 'Real-time Cardano stake pool explorer with a live block ticker and pool metrics.'
      }
    });
  });

  app.get('/discover', (req, res) => {
    sendPage(res, {
      title: 'Discover Cardano Pools | adapools.xyz',
      description: 'Find Cardano stake pools by stake, delegators, saturation, margin, pledge, blocks and registration date.',
      path: '/discover'
    });
  });

  app.get('/pool/:poolId', async (req, res) => {
    try {
      const pool = await collections.poolCache.findOne(
        { bech32_pool_id: req.params.poolId },
        {
          projection: {
            _id: 0, bech32_pool_id: 1, ticker: 1, name: 1, description: 1, logo: 1,
            active_stake: 1, active_stake_lovelace: 1, delegators: 1, delegators_numeric: 1,
            pool_interest_numeric: 1, saturation_percent: 1, blocks_numeric: 1,
            lifetime_blocks: 1, blocks: 1, retiring_epoch: 1, current_epoch: 1
          }
        }
      );
      if (!pool) {
        sendPage(res, {
          title: 'Pool not found | adapools.xyz',
          description: 'This Cardano stake pool could not be found.',
          path: req.path,
          noIndex: true
        }, 404);
        return;
      }
      sendPage(res, poolPageData(pool));
    } catch (error) {
      console.error('[adapools] Failed to render pool SEO page:', error);
      res.status(503).type('text/plain').send('Page temporarily unavailable');
    }
  });

  return (req, res) => {
    sendPage(res, {
      title: 'Page not found | adapools.xyz',
      description: 'This page could not be found.',
      path: req.path,
      noIndex: true
    }, 404);
  };
};
