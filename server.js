// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 60 * 5 }); // cache 5 minutos
app.use(cors());
app.use(express.static('public'));

async function fetchHTML(url, params = {}) {
  const res = await axios.get(url, {
    params,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 15000
  });
  return res.data;
}

app.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'missing query param q' });
    const page = parseInt(req.query.page || '1', 10);

    const cacheKey = `search:${q}:p${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const ddgUrl = 'https://html.duckduckgo.com/html/';
    const params = { q, s: (page - 1) * 10 };
    const html = await fetchHTML(ddgUrl, params);
    const $ = cheerio.load(html);

    const results = [];
    $('.result').each((i, el) => {
      const a = $(el).find('a.result__a').first();
      const href = a.attr('href') || a.attr('data-href') || '';
      const title = a.text().trim();
      const snippet = $(el).find('.result__snippet').text().trim() || $(el).find('.result__excerpt').text().trim();
      if (href && title) {
        results.push({ title, href, snippet });
      }
    });

    if (results.length === 0) {
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();
        if (href && title && href.startsWith('http')) {
          results.push({ title, href, snippet: '' });
        }
      });
    }

    const out = { query: q, page, results: results.slice(0, 30) };
    cache.set(cacheKey, out);
    res.json(out);
  } catch (err) {
    console.error(err && err.message);
    res.status(500).json({ error: 'failed to fetch search results', details: err.message });
  }
});

app.get('/images', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'missing query param q' });

    const cacheKey = `images:${q}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = 'https://duckduckgo.com/';
    const html = await fetchHTML(url, { q, iax: 'images', ia: 'images' });
    const $ = cheerio.load(html);

    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-duck-src');
      if (src && src.startsWith('http')) {
        images.push({ thumbnail: src, source: null });
      }
    });

    const scripts = $('script').map((i, el) => $(el).html()).get().join('\n');
    const urlRegex = /https?:\/\/[^'"\s]+?\.(?:png|jpe?g|gif|webp)(\?[^'"\s]*)?/ig;
    const found = [];
    let m;
    while ((m = urlRegex.exec(scripts)) !== null && found.length < 60) {
      found.push(m[0]);
    }
    found.forEach(u => images.push({ thumbnail: u, source: null }));

    const unique = [];
    const seen = new Set();
    for (const it of images) {
      if (!it.thumbnail) continue;
      const key = it.thumbnail;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(it);
      if (unique.length >= 40) break;
    }

    const out = { query: q, images: unique };
    cache.set(cacheKey, out);
    res.json(out);
  } catch (err) {
    console.error(err && err.message);
    res.status(500).json({ error: 'failed to fetch images', details: err.message });
  }
});

app.get('/ping', (req, res) => res.json({ ok: true, name: 'Montenegro Search' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Montenegro! running on http://localhost:${PORT}`));
