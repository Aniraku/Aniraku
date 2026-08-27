import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

const directFooterRoutes = [
  'src/pages/Home.jsx',
  'src/pages/Catalog.jsx',
  'src/pages/Schedule.jsx',
  'src/pages/AnimeDetail.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Settings.jsx',
  'src/pages/Random.jsx',
  'src/pages/Admin.jsx',
  'src/pages/SyncCallback.jsx',
]

const watch = await read('src/pages/Watch.jsx')
assert.doesNotMatch(watch, /components\/Footer\/Footer/)

for (const route of directFooterRoutes) {
  const source = await read(route)
  assert.match(source, /components\/Footer\/Footer/)
  assert.match(source, /<Footer(?:\s|\/>|>)/)
}

const [footer, footerStyle, legalPage, auth, newPassword, error] = await Promise.all([
  read('src/components/Footer/Footer.jsx'),
  read('src/components/Footer/footer.style.js'),
  read('src/components/LegalPage/LegalPage.jsx'),
  read('src/pages/Auth.jsx'),
  read('src/pages/NewPassword.jsx'),
  read('src/pages/Error.jsx'),
])

assert.match(footer, /const Footer = \(\{ compact = true \}\)/)
assert.match(footer, /This product uses TMDB and the TMDB APIs but is not endorsed/)
assert.match(footer, /blue_long_2-[a-f0-9]+\.svg/)
assert.match(footer, /@media \(max-width: 720px\) \{ grid-template-columns: 1fr;/)
assert.match(footerStyle, /@media \(max-width: 768px\)/)
assert.match(footerStyle, /calc\(74px \+ var\(--safe-bottom\)\)/)
assert.match(legalPage, /<Footer compact \/>/)
assert.match(auth, /<CompactFooter \/>/)
assert.match(newPassword, /<Footer compact \/>/)
assert.match(error, /<Footer compact \/>/)

console.log('Compact footer coverage and TMDB attribution contract passed.')
