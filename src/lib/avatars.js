/** Preset avatars hosted on the public Supabase Storage bucket "Anixen Avatars". */
import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const AVATAR_BUCKET = 'Anixen Avatars'

const FILES = [
  // Original avatar presets retained for existing profile selections.
  '01.png', '02.png', '03.png', '06.png', '07.png',
  'avatar-02.png', 'avatar-04.png', 'avatar-12.png', 'avatar-17.png',
  'avatar-18.png', 'avatar-20.png', 'avatar-22.png', 'avatar-23.png',
  'avatar2-08.png', 'avatar2-10.png',
  'beerus.png', 'vegeta.png',
  'File2.jpg', 'File4.png', 'File6.png', 'File9.jpg',
  'user-00.jpeg', 'user-01.jpeg', 'user-02.jpeg', 'user-04.jpeg',
  'user-07.jpeg', 'user-08.jpeg',
  'attack_on_titan_final_season_01_avatar_01.png',
  'attack_on_titan_final_season_02_avatar_02.png',
  'attack_on_titan_final_season_03_avatar_03.png',
  'attack_on_titan_final_season_04_avatar_04.png',
  'attack_on_titan_final_season_05_avatar_05.png',
  'attack_on_titan_final_season_06_avatar_06.png',
  'attack_on_titan_final_season_07_avatar_07.png',
  'attack_on_titan_final_season_08_avatar_08.png',
  'attack_on_titan_final_season_09_avatar_09.png',
  'attack_on_titan_final_season_10_avatar_10.png',
  'blue_lock_episode_nagi_01_avatar_01.png',
  'blue_lock_episode_nagi_02_avatar_02.png',
  'blue_lock_episode_nagi_03_avatar_03.png',
  'blue_lock_episode_nagi_04_avatar_04.png',
  'blue_lock_episode_nagi_05_avatar_05.png',
  'blue_lock_episode_nagi_06_avatar_06.png',
  'blue_lock_episode_nagi_07_avatar_07.png',
  'blue_lock_episode_nagi_08_avatar_08.png',
  'blue_lock_episode_nagi_09_avatar_09.png',
  'blue_lock_season_2_01_avatar_01.png',
  'blue_lock_season_2_02_avatar_02.png',
  'blue_lock_season_2_03_avatar_03.png',
  'blue_lock_season_2_04_avatar_04.png',
  'blue_lock_season_2_05_avatar_05.png',
  'blue_lock_season_2_06_avatar_06.png',
  'blue_lock_season_2_07_avatar_07.png',
  'blue_lock_season_2_08_avatar_08.png',
  'blue_lock_season_2_09_avatar_09.png',
  'blue_lock_season_2_10_avatar_10.png',
  'blue_lock_season_2_11_avatar_11.png',
  'blue_lock_season_2_12_avatar_12.png',
  'blue_lock_season_2_13_avatar_13.png',
  'blue_lock_season_2_14_avatar_14.png',
  'blue_lock_season_2_15_avatar_15.png',
  'clevatess_ii_01_avatar_01.png',
  'clevatess_ii_02_avatar_02.png',
  'clevatess_ii_03_avatar_03.png',
  'clevatess_ii_04_avatar_04.png',
  'clevatess_ii_05_avatar_05.png',
  'clevatess_ii_06_avatar_06.png',
  'clevatess_ii_07_avatar_07.png',
  'clevatess_ii_08_avatar_08.png',
  'demon_slayer_infinity_castle_01_avatar_01.png',
  'demon_slayer_infinity_castle_02_avatar_02.png',
  'demon_slayer_infinity_castle_03_avatar_03.png',
  'demon_slayer_infinity_castle_04_avatar_04.png',
  'demon_slayer_infinity_castle_05_avatar_05.png',
  'demon_slayer_infinity_castle_06_avatar_06.png',
  'demon_slayer_infinity_castle_07_avatar_07.png',
  'demon_slayer_infinity_castle_08_avatar_08.png',
  'demon_slayer_infinity_castle_09_avatar_09.png',
  'demon_slayer_infinity_castle_10_avatar_10.png',
  'demon_slayer_infinity_castle_11_avatar_11.png',
  'demon_slayer_infinity_castle_12_avatar_12.png',
  'demon_slayer_infinity_castle_13_avatar_13.png',
  'demon_slayer_infinity_castle_14_avatar_14.png',
  'demon_slayer_infinity_castle_15_avatar_15.png',
  'demon_slayer_infinity_castle_16_avatar_16.png',
  'demon_slayer_infinity_castle_17_avatar_17.png',
  'demon_slayer_infinity_castle_18_avatar_18.png',
  'demon_slayer_infinity_castle_19_avatar_19.png',
  'demon_slayer_infinity_castle_20_avatar_20.png',
  'link_click_01_avatar_01.png',
  'link_click_02_avatar_02.png',
  'link_click_03_avatar_03.png',
  'link_click_04_avatar_04.png',
  'link_click_05_avatar_05.png',
  'link_click_06_avatar_06.png',
  'link_click_07_avatar_07.png',
  'link_click_08_avatar_08.png',
  'link_click_09_avatar_09.png',
  'link_click_10_avatar_10.png',
  'mushoku_tensei_s3_01_rudeus.png',
  'mushoku_tensei_s3_02_eris.png',
  'mushoku_tensei_s3_03_sylphiette.png',
  'mushoku_tensei_s3_04_roxy.png',
  'smoking_behind_supermarket_01_avatar_01.png',
  'smoking_behind_supermarket_02_avatar_02.png',
  'smoking_behind_supermarket_03_avatar_03.png',
  'smoking_behind_supermarket_04_avatar_04.png',
  'smoking_behind_supermarket_05_avatar_05.png',
  'smoking_behind_supermarket_06_avatar_06.png',
  'smoking_behind_supermarket_07_avatar_07.png',
  'smoking_behind_supermarket_08_avatar_08.png',
  'smoking_behind_supermarket_09_avatar_09.png',
  'smoking_behind_supermarket_10_avatar_10.png',
]

const HIDDEN_AVATARS = new Set([
  'smoking_behind_supermarket_03_avatar_03.png',
  'smoking_behind_supermarket_04_avatar_04.png',
  'smoking_behind_supermarket_05_avatar_05.png',
  'smoking_behind_supermarket_07_avatar_07.png',
  'smoking_behind_supermarket_08_avatar_08.png',
  'smoking_behind_supermarket_09_avatar_09.png',
  'smoking_behind_supermarket_10_avatar_10.png',
  'link_click_01_avatar_01.png',
  'link_click_02_avatar_02.png',
  'link_click_03_avatar_03.png',
  'link_click_04_avatar_04.png',
  'link_click_05_avatar_05.png',
  'link_click_06_avatar_06.png',
  'link_click_07_avatar_07.png',
  'link_click_08_avatar_08.png',
  'link_click_09_avatar_09.png',
  'link_click_10_avatar_10.png',
])

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
    id: index,
    name: file.name,
    url: avatarUrl(file.name),
  }
}

export const AVATAR_LIST = FILES
  .filter(name => !HIDDEN_AVATARS.has(name))
  .map((name, index) => toAvatar({ name }, index))

const IMAGE_FILE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i

async function listStorageFiles(prefix = '', visited = new Set()) {
  if (visited.has(prefix)) return []
  visited.add(prefix)

  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error

  const files = []
  for (const entry of data || []) {
    if (!entry.name) continue
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    // Supabase returns folders without an id; recurse so avatars also work
    // when the bucket files are organized under one or more directories.
    if (!entry.id) {
      files.push(...await listStorageFiles(path, visited))
    } else if (IMAGE_FILE_PATTERN.test(entry.name) && !HIDDEN_AVATARS.has(entry.name)) {
      files.push({ ...entry, name: path })
    }
  }
  return files
}

/**
 * Read the bucket contents so additions and removals made in Supabase are
 * reflected in the profile without a code deploy.
 */
export async function listAvatars() {
  const files = await listStorageFiles()
  return files.map((file, index) => toAvatar(file, index))
}

export function defaultAvatar(seed = 0, avatars = AVATAR_LIST) {
  const list = avatars.length ? avatars : AVATAR_LIST
  const numericSeed = typeof seed === 'number' ? seed : String(seed).length
  return list[Math.abs(numericSeed) % list.length]
}
