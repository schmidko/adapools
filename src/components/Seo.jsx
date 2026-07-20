import { useEffect } from 'react';

const SITE_URL = 'https://adapools.xyz';

const upsertMeta = ({ attr, key, content }) => {
  if (!content) return;

  let element = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertLink = ({ rel, href }) => {
  if (!href) return;

  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

const upsertJsonLd = (id, payload) => {
  if (!payload) return;

  let element = document.head.querySelector(`script#${id}`);
  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
};

const Seo = ({
  title,
  description,
  path = '/',
  image = '/icon-512.png',
  type = 'website',
  jsonLd
}) => {
  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();
    const imageUrl = new URL(image, SITE_URL).toString();

    document.title = title;
    upsertMeta({ attr: 'name', key: 'description', content: description });
    upsertLink({ rel: 'canonical', href: canonicalUrl });

    upsertMeta({ attr: 'property', key: 'og:title', content: title });
    upsertMeta({ attr: 'property', key: 'og:description', content: description });
    upsertMeta({ attr: 'property', key: 'og:type', content: type });
    upsertMeta({ attr: 'property', key: 'og:url', content: canonicalUrl });
    upsertMeta({ attr: 'property', key: 'og:image', content: imageUrl });

    upsertMeta({ attr: 'name', key: 'twitter:card', content: 'summary_large_image' });
    upsertMeta({ attr: 'name', key: 'twitter:title', content: title });
    upsertMeta({ attr: 'name', key: 'twitter:description', content: description });
    upsertMeta({ attr: 'name', key: 'twitter:image', content: imageUrl });

    upsertJsonLd('page-json-ld', jsonLd);
  }, [description, image, jsonLd, path, title, type]);

  return null;
};

export default Seo;
