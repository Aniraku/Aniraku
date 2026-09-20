/** Preset avatars hosted on the public Supabase Storage bucket "Anixen Avatars". */
import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const AVATAR_BUCKET = 'Anixen Avatars'

const FILES = [
  '01.png', '02.png', '03.png', '06.png', '07.png',
  'avatar-02.png', 'avatar-04.png', 'avatar-12.png', 'avatar-17.png',
  'avatar-18.png', 'avatar-20.png', 'avatar-22.png', 'avatar-23.png',
  'avatar2-08.png', 'avatar2-10.png',
  'beerus.png', 'vegeta.png',
  'File2.jpg', 'File4.png', 'File6.png', 'File9.jpg',
  'user-00.jpeg', 'user-01.jpeg', 'user-02.jpeg', 'user-04.jpeg',
  'user-07.jpeg', 'user-08.jpeg',
]

function encodeStoragePath(path) {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

export function avatarUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeStoragePath(AVATAR_BUCKET + '/' + pathOrUrl)}`
}

function toAvatar(file, index) {
  return {
    id: file.id || file.name || index,
    name: file.name,
    url: avatarUrl(file.name),
  }
}

export const AVATAR_LIST = FILES.map((name, index) => toAvatar({ name }, index))

const IMAGE_FILE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i

/**
 * Read the bucket contents so additions and removals made in Supabase are
 * reflected in the profile without a code deploy.
 */
export async function listAvatars() {
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).list('', {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error

  return (data || [])
    .filter(file => file.name && IMAGE_FILE_PATTERN.test(file.name))
    .map(toAvatar)
}

export function defaultAvatar(seed = 0, avatars = AVATAR_LIST) {
  const list = avatars.length ? avatars : AVATAR_LIST
  return list[Math.abs(seed) % list.length]
}
