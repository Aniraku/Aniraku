import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  canSubmitComment,
  getCommentDisplayContent,
  isTrustedGiphyGifUrl,
  toGiphyGif,
} from '../src/lib/commentContent.js'

const mediaUrl = 'https://media2.giphy.com/media/example/giphy.gif'

assert.equal(isTrustedGiphyGifUrl(mediaUrl), true)
assert.equal(isTrustedGiphyGifUrl('https://i.giphy.com/example.gif'), true)
assert.equal(isTrustedGiphyGifUrl('http://media.giphy.com/example.gif'), false)
assert.equal(isTrustedGiphyGifUrl('https://example.com/reaction.gif'), false)

assert.deepEqual(getCommentDisplayContent('A legacy reaction ||GIF:https://media.giphy.com/media/legacy/giphy.gif', null), {
  text: 'A legacy reaction',
  gifUrl: 'https://media.giphy.com/media/legacy/giphy.gif',
})
assert.deepEqual(getCommentDisplayContent('New persisted reaction', mediaUrl), {
  text: 'New persisted reaction',
  gifUrl: mediaUrl,
})
assert.equal(canSubmitComment('', mediaUrl), true)
assert.equal(canSubmitComment('A text comment', ''), true)
assert.equal(canSubmitComment('   ', ''), false)

assert.deepEqual(toGiphyGif({
  id: 'reaction',
  title: 'Reaction',
  images: {
    fixed_width_small: { url: 'https://media1.giphy.com/media/example/200w.gif' },
    original: { url: mediaUrl },
  },
}), {
  id: 'reaction',
  url: mediaUrl,
  previewUrl: mediaUrl,
  label: 'Reaction',
})

const commentsSource = await readFile(new URL('../src/components/Comments/Comments.jsx', import.meta.url), 'utf8')
assert.match(commentsSource, /gif_url: mediaUrl \|\| null/)
assert.match(commentsSource, /is_spoiler: Boolean\(spoiler\)/)
assert.match(commentsSource, /Spoiler hidden · tap to reveal/)
assert.match(commentsSource, /aria-label="Spoiler hidden\. Activate to reveal this comment\."/)
assert.match(commentsSource, /rating', 'g'/)
assert.match(commentsSource, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
assert.match(commentsSource, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)/)
assert.match(commentsSource, /max-height: 168px;/)
assert.match(commentsSource, /overflow-y: auto;/)
assert.match(commentsSource, /overscroll-behavior: contain;/)
assert.match(commentsSource, /aspect-ratio: 1\.45;/)
assert.match(commentsSource, /height: 100%; object-fit: contain; width: 100%;/)
assert.doesNotMatch(commentsSource, /const GifLabel = styled\.span/)

console.log('Comment GIF and spoiler regressions passed.')
