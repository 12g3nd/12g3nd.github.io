import { useEffect } from 'react';

function setAttr(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Sets the document <title> and (optionally) the description / Open Graph meta
 * for the current route. Static tags in index.html remain the fallback for
 * social scrapers that don't run JS; this updates browser tabs, bookmarks, and
 * JS-rendering crawlers (e.g. Google).
 */
export default function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setAttr('meta[property="og:title"]', 'content', title);
    if (description) {
      setAttr('meta[name="description"]', 'content', description);
      setAttr('meta[property="og:description"]', 'content', description);
    }
  }, [title, description]);
}
