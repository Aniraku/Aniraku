import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const [home, mobileNav] = await Promise.all([
  readFile(new URL('src/pages/Home.jsx', root), 'utf8'),
  readFile(new URL('src/components/MobileBottomNav.jsx', root), 'utf8'),
])

assert.match(home, /Trending now/)
assert.match(home, /Fresh from the season/)
assert.match(home, /Airing next/)
assert.match(home, /Trending right now/)
assert.match(home, /Movie night/)
assert.match(home, /useHomePageData/)
assert.match(home, /const unifiedTrending = useMemo/)
assert.match(home, /const freshAiring = useMemo/)
assert.match(home, /const weeklyFavorites = useMemo/)
assert.match(home, /const heroTrending = useMemo/)
assert.match(home, /window\.setInterval/)
assert.match(home, /8500/)
assert.match(home, /prefers-reduced-motion: reduce/)
assert.doesNotMatch(home, /HeroCycle/)
assert.doesNotMatch(home, /heroPaused/)
assert.doesNotMatch(home, /Trending \{featuredIndex \+ 1\} of/)
assert.doesNotMatch(home, /Pause automatic trending rotation/)
assert.match(home, /@media \(max-width: 680px\)/)
assert.match(home, /@media \(max-width: 670px\)/)
assert.match(home, /@media \(max-width: 920px\)/)
assert.match(home, /scroll-snap-type: x proximity/)
assert.match(home, /scrollbar-width: none/)
assert.doesNotMatch(home, /scrollbar-width: thin/)
assert.doesNotMatch(home, /Trending anime/)
assert.doesNotMatch(home, /Trending movies/)
assert.doesNotMatch(home, /anilist\.co/)
assert.match(mobileNav, /FaHeart/)
assert.match(mobileNav, /aniraku:open-support/)
assert.match(mobileNav, /label: 'Support'/)

console.log('Home redesign structure and responsive-layout checks passed.')
