import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('..', import.meta.url)
const [home, mobileNav] = await Promise.all([
  readFile(new URL('src/pages/Home.jsx', root), 'utf8'),
  readFile(new URL('src/components/MobileBottomNav.jsx', root), 'utf8'),
])

assert.match(home, /Discover anime/)
assert.match(home, /Top airing/)
assert.match(home, /Just finished/)
assert.match(home, /Top movies/)
assert.match(home, /Airing schedule/)
assert.match(home, /useHomePageData/)
assert.match(home, /const freshAiring = useMemo/)
assert.match(home, /const mediaKey = \(item\) =>/)
assert.match(home, /const uniqueMedia = \(items\) =>/)
assert.match(home, /key=\{mediaKey\(item\)\}/)
assert.match(home, /const freshAiring = useMemo\(\(\) => uniqueMedia\(airingList\), \[airingList\]\)/)
assert.match(home, /const popularItems = useMemo\(\(\) => uniqueMedia\(\[\.\.\.trendingList, \.\.\.moviesList\]\), \[trendingList, moviesList\]\)/)
assert.doesNotMatch(home, /freshAiring = useMemo\([^\n]+featured/)
assert.match(home, /groupHomeScheduleRows/)
assert.match(home, /initialPopulatedScheduleDayIndex/)
assert.match(home, /userSelectedScheduleDay\.current = true/)
assert.match(home, /window\.setInterval/)
assert.match(home, /8500/)
assert.match(home, /prefers-reduced-motion: reduce/)
assert.doesNotMatch(home, /HeroCycle/)
assert.doesNotMatch(home, /heroPaused/)
assert.match(home, /align-items: start/)
assert.match(home, /aria-pressed=\{index === activeScheduleDay\}/)
assert.match(home, /@media \(max-width: 680px\)/)
assert.match(home, /@media \(max-width: 980px\)/)
assert.match(home, /@media \(max-width: 520px\)/)
assert.match(home, /scrollbar-width: none/)
assert.doesNotMatch(home, /scrollbar-width: thin/)
assert.doesNotMatch(home, /Kitsu/)
assert.doesNotMatch(home, /anilist\.co/)
assert.match(mobileNav, /FaHeart/)
assert.match(mobileNav, /aniraku:open-support/)
assert.match(mobileNav, /label: 'Support'/)

console.log('Home redesign structure and responsive-layout checks passed.')
