import DOMPurify from 'dompurify'

/** Sanitize GitHub-rendered README HTML and point relative links/images at the repo. */
export function prepareReadme(html: string, fullName: string, branch: string) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style'],
  })
  const tpl = document.createElement('template')
  tpl.innerHTML = clean
  const rawBase = `https://raw.githubusercontent.com/${fullName}/${branch}/`
  const blobBase = `https://github.com/${fullName}/blob/${branch}/`
  const isAbs = (s: string) => /^(https?:|data:|mailto:|#)/i.test(s)
  tpl.content.querySelectorAll('img[src]').forEach((img) => {
    const s = img.getAttribute('src') || ''
    if (!isAbs(s)) img.setAttribute('src', rawBase + s.replace(/^\.?\//, ''))
    img.setAttribute('loading', 'lazy')
  })
  tpl.content.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href') || ''
    if (h.startsWith('#')) {
      a.removeAttribute('href')
      return
    }
    if (!isAbs(h)) a.setAttribute('href', blobBase + h.replace(/^\.?\//, ''))
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener nofollow')
  })
  return tpl.innerHTML
}
