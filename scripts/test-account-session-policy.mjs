import assert from 'node:assert/strict'
import { buildProfileSeed, isUnverifiedEmailUser } from '../src/lib/accountSessionPolicy.js'

const emailUser = {
  id: 'abc12345',
  email: 'viewer@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: { username: 'Viewer_Name', display_name: 'Viewer Name' },
}

assert.equal(isUnverifiedEmailUser(emailUser), true)
assert.equal(isUnverifiedEmailUser({ ...emailUser, email_confirmed_at: '2026-08-23T00:00:00.000Z' }), false)
assert.deepEqual(buildProfileSeed(emailUser), {
  id: 'abc12345',
  username: 'viewer_name',
  display_name: 'Viewer Name',
  bio: null,
  avatar_url: null,
})

console.log('account session policy tests passed')
