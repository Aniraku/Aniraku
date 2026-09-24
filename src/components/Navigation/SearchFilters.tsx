import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import { FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaUndo } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Filter value model — mirrors the live miruro.to Search route.
// URL params written/read: query (handled by the page), tags, genres, format,
// status, countryOfOrigin, season, startDate_like, source, isAdult,
// averageScoreMin, averageScoreMax, sort, type, dubLanguage.
// ---------------------------------------------------------------------------

export interface SearchFilterValues {
  tags: string[];
  genres: string[];
  sort: string[];
  type: string;
  format?: string;
  status?: string;
  countryOfOrigin?: string;
  season?: string;
  startDate_like?: string;
  source?: string;
  isAdult?: boolean;
  averageScore: { min: number; max: number };
  dubLanguage?: string;
}

export const defaultFilterValues = (): SearchFilterValues => ({
  tags: [],
  genres: [],
  sort: ['POPULARITY_DESC'],
  type: 'ANIME',
  averageScore: { min: 0, max: 100 },
});

export const parseFilterValues = (
  params: URLSearchParams,
): SearchFilterValues => ({
  tags: params.get('tags')?.split(',').filter(Boolean) || [],
  genres: params.get('genres')?.split(',').filter(Boolean) || [],
  sort: params.get('sort')?.split(',').filter(Boolean) || [],
  type: params.get('type') || 'ANIME',
  format: params.get('format') || undefined,
  status: params.get('status') || undefined,
  countryOfOrigin: params.get('countryOfOrigin') || undefined,
  isAdult:
    params.get('isAdult') === 'true'
      ? true
      : params.get('isAdult') !== 'false'
        ? undefined
        : false,
  season: params.get('season') || undefined,
  startDate_like: params.get('startDate_like') || undefined,
  source: params.get('source') || undefined,
  averageScore: {
    min: parseInt(params.get('averageScoreMin') || '0', 10),
    max: parseInt(params.get('averageScoreMax') || '100', 10),
  },
  dubLanguage: params.get('dubLanguage') || undefined,
});

export const serializeFilterValues = (
  query: string,
  filters: SearchFilterValues,
): URLSearchParams => {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (filters.tags.length) params.set('tags', filters.tags.join(','));
  if (filters.genres.length) params.set('genres', filters.genres.join(','));
  if (filters.format) params.set('format', filters.format);
  if (filters.status) params.set('status', filters.status);
  if (filters.countryOfOrigin)
    params.set('countryOfOrigin', filters.countryOfOrigin);
  if (filters.season) params.set('season', filters.season);
  if (filters.startDate_like)
    params.set('startDate_like', filters.startDate_like);
  if (filters.source) params.set('source', filters.source);
  if (filters.isAdult != null)
    params.set('isAdult', filters.isAdult.toString());
  if (filters.averageScore.min !== 0)
    params.set('averageScoreMin', filters.averageScore.min.toString());
  if (filters.averageScore.max !== 100)
    params.set('averageScoreMax', filters.averageScore.max.toString());
  if (filters.sort.length) params.set('sort', filters.sort.join(','));
  if (filters.type) params.set('type', filters.type);
  if (filters.dubLanguage) params.set('dubLanguage', filters.dubLanguage);
  return params;
};

// ---------------------------------------------------------------------------
// Option lists — exact labels/order from the live bundle.
// ---------------------------------------------------------------------------

interface SelOption {
  label: string;
  value: string | number | boolean | undefined;
}

export const genreOptionsList: string[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Hentai',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export const tagOptionsList: string[] = [
  'Achromatic', 'Achronological Order', 'Acrobatics', 'Acting', 'Adoption', 'Advertisement',
  'Afterlife', 'Age Gap', 'Age Regression', 'Agender', 'Agriculture', 'Airsoft', 'Alchemy',
  'Aliens', 'Alternate Universe', 'American Football', 'Amnesia', 'Anachronism',
  'Ancient China', 'Angels', 'Animals', 'Anthology', 'Anthropomorphism', 'Anti-Hero', 'Archery',
  'Aromantic', 'Arranged Marriage', 'Artificial Intelligence', 'Assassins', 'Astronomy',
  'Athletics', 'Augmented Reality', 'Autobiographical', 'Aviation', 'Badminton', 'Band', 'Bar',
  'Baseball', 'Basketball', 'Battle Royale', 'Biographical', 'Board Game', 'Boarding School',
  'Body Horror', 'Body Swapping', 'Bowling', 'Boxing', 'Boys Love', 'Bullying', 'Butler',
  'Calligraphy', 'Cannibalism', 'Card Battle', 'Cars', 'Centaur', 'CGI', 'Cheerleading',
  'Chibi', 'Chimera', 'Chuunibyou', 'Circus', 'Class Struggle', 'Classic Literature',
  'Classical Music', 'Clone', 'Coastal', 'College', 'Coming of Age', 'Conspiracy',
  'Cosmic Horror', 'Cosplay', 'Cowboys', 'Crime', 'Criminal Organization', 'Crossdressing',
  'Crossover', 'Cult', 'Cultivation', 'Cute Boys Doing Cute Things',
  'Cute Girls Doing Cute Things', 'Cyberpunk', 'Cyborg', 'Cycling', 'Dancing', 'Death Game',
  'Delinquents', 'Demons', 'Denpa', 'Desert', 'Detective', 'Dinosaurs', 'Disability',
  'Dissociative Identities', 'Dragons', 'Drawing', 'Drugs', 'Dullahan', 'Dungeon', 'Dystopian',
  'E-Sports', 'Eco-Horror', 'Economics', 'Educational', 'Elderly Protagonist', 'Elf',
  'Ensemble Cast', 'Environmental', 'Episodic', 'Ero Guro', 'Espionage', 'Estranged Family',
  'Fairy', 'Fairy Tale', 'Fake Relationship', 'Family Life', 'Fashion', 'Female Harem',
  'Female Protagonist', 'Femboy', 'Fencing', 'Filmmaking', 'Firefighters', 'Fishing', 'Fitness',
  'Flash', 'Food', 'Football', 'Foreign', 'Found Family', 'Fugitive', 'Full CGI', 'Full Color',
  'Gambling', 'Gangs', 'Gender Bending', 'Ghost', 'Go', 'Goblin', 'Gods', 'Golf', 'Gore',
  'Guns', 'Gyaru', 'Handball', 'Henshin', 'Hikikomori', 'Hip-hop Music', 'Historical',
  'Homeless', 'Horticulture', 'Ice Skating', 'Idol', 'Inn', 'Isekai', 'Iyashikei', 'Jazz Music',
  'Josei', 'Judo', 'Kaiju', 'Karuta', 'Kemonomimi', 'Kids', 'Kingdom Management', 'Konbini',
  'Kuudere', 'Lacrosse', 'Language Barrier', 'Lost Civilization', 'Love Triangle', 'Mafia',
  'Magic', 'Mahjong', 'Maids', 'Makeup', 'Male Harem', 'Male Protagonist', 'Marriage',
  'Martial Arts', 'Matchmaking', 'Matriarchy', 'Medicine', 'Memory Manipulation', 'Mermaid',
  'Meta', 'Metal Music', 'Military', 'Mixed Gender Harem', 'Monster Boy', 'Monster Girl',
  'Mopeds', 'Motorcycles', 'Mountaineering', 'Musical Theater', 'Mythology', 'Natural Disaster',
  'Necromancy', 'Nekomimi', 'Ninja', 'No Dialogue', 'Noir', 'Non-fiction', 'Nudity', 'Nun',
  'Office', 'Office Lady', 'Oiran', 'Ojou-sama', 'Orphan', 'Otaku Culture', 'Outdoor',
  'Pandemic', 'Parenthood', 'Parkour', 'Parody', 'Philosophy', 'Photography', 'Pirates',
  'Poker', 'Police', 'Politics', 'Polyamorous', 'Post-Apocalyptic', 'POV',
  'Primarily Adult Cast', 'Primarily Animal Cast', 'Primarily Child Cast',
  'Primarily Female Cast', 'Primarily Male Cast', 'Primarily Teen Cast', 'Prison',
  'Proxy Battle', 'Puppetry', 'Rakugo', 'Real Robot', 'Rehabilitation', 'Reincarnation',
  'Religion', 'Restaurant', 'Revenge', 'Robots', 'Rock Music', 'Rotoscoping', 'Royal Affairs',
  'Rugby', 'Rural', 'Samurai', 'Satire', 'School', 'School Club', 'Scuba Diving', 'Seinen',
  'Shapeshifting', 'Ships', 'Shogi', 'Shoujo', 'Shounen', 'Shrine Maiden', 'Skateboarding',
  'Skeleton', 'Slapstick', 'Slavery', 'Snowscape', 'Software Development', 'Space',
  'Space Opera', 'Spearplay', 'Steampunk', 'Stop Motion', 'Succubus', 'Suicide', 'Sumo',
  'Super Power', 'Super Robot', 'Superhero', 'Surfing', 'Surreal Comedy', 'Survival',
  'Swimming', 'Swordplay', 'Table Tennis', 'Tanks', 'Tanned Skin', 'Teacher', 'Teens Love',
  'Tennis', 'Terrorism', 'Time Loop', 'Time Manipulation', 'Time Skip', 'Tokusatsu', 'Tomboy',
  'Torture', 'Tragedy', 'Trains', 'Transgender', 'Travel', 'Triads', 'Tsundere', 'Twins',
  'Unrequited Love', 'Urban', 'Urban Fantasy', 'Vampire', 'Veterinarian', 'Video Games',
  'Vikings', 'Villainess', 'Virtual World', 'Volleyball', 'VTuber', 'War', 'Werewolf', 'Witch',
  'Work', 'Wrestling', 'Writing', 'Wuxia', 'Yakuza', 'Yandere', 'Youkai', 'Yuri', 'Zombie',
];

export const statusOptionsList: string[] = [
  'FINISHED',
  'RELEASING',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS',
];

export const formatOptionsList: string[] = [
  'TV',
  'TV_SHORT',
  'MOVIE',
  'SPECIAL',
  'OVA',
  'ONA',
  'MUSIC',
];

export const seasonOptionsList: string[] = [
  'WINTER',
  'SPRING',
  'SUMMER',
  'FALL',
];

export const sourceOptionsList: string[] = [
  'ORIGINAL',
  'MANGA',
  'LIGHT_NOVEL',
  'VISUAL_NOVEL',
  'VIDEO_GAME',
  'OTHER',
  'NOVEL',
  'DOUJINSHI',
  'ANIME',
  'WEB_NOVEL',
  'LIVE_ACTION',
  'GAME',
  'COMIC',
  'MULTIMEDIA_PROJECT',
  'PICTURE_BOOK',
];

export const countryNameMap: Record<string, string> = {
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  TW: 'Taiwan',
};

export const dubLanguageOptionsList: string[] = [
  'Japanese',
  'English',
  'Korean',
  'Italian',
  'Spanish',
  'Portuguese',
  'French',
  'German',
  'Hebrew',
  'Hungarian',
  'Chinese',
  'Arabic',
  'Filipino',
  'Catalan',
  'Finnish',
  'Turkish',
  'Dutch',
  'Swedish',
  'Thai',
  'Tagalog',
  'Malaysian',
  'Indonesian',
  'Vietnamese',
  'Nepali',
  'Hindi',
  'Urdu',
];

// Full MediaSort enum shown by the live "Sort By" multi-select.
export const sortOptionsList: string[] = [
  'ID',
  'ID_DESC',
  'ANILIST_ID',
  'ANILIST_ID_DESC',
  'TITLE_ROMAJI',
  'TITLE_ROMAJI_DESC',
  'TITLE_ENGLISH',
  'TITLE_ENGLISH_DESC',
  'TITLE_NATIVE',
  'TITLE_NATIVE_DESC',
  'MEAN_SCORE',
  'MEAN_SCORE_DESC',
  'AVERAGE_SCORE',
  'AVERAGE_SCORE_DESC',
  'POPULARITY',
  'POPULARITY_DESC',
  'FAVOURITES',
  'FAVOURITES_DESC',
  'EPISODES',
  'EPISODES_DESC',
  'SEASON_YEAR',
  'SEASON_YEAR_DESC',
  'START_DATE',
  'START_DATE_DESC',
  'END_DATE',
  'END_DATE_DESC',
  'UPDATED_AT',
  'UPDATED_AT_DESC',
  'CHAPTERS',
  'CHAPTERS_DESC',
  'DURATION',
  'DURATION_DESC',
  'FORMAT',
  'FORMAT_DESC',
  'STATUS',
  'STATUS_DESC',
  'TYPE',
  'TYPE_DESC',
  'VOLUMES',
  'VOLUMES_DESC',
  'SEARCH_MATCH',
];

const CURRENT_YEAR = new Date().getFullYear();

const toOptions = (values: string[]): SelOption[] =>
  values.map((v) => ({ label: v, value: v }));

const ANY_FORMAT: SelOption = { label: 'Any Format', value: '' };
const ANY_STATUS: SelOption = { label: 'Any Status', value: '' };
const ANY_COUNTRY: SelOption = { label: 'Any Country', value: '' };
const ANY_SEASON: SelOption = { label: 'Any Season', value: '' };
const ANY_SOURCE: SelOption = { label: 'Any Source', value: '' };
const ANY_YEAR: SelOption = { label: 'Any year', value: '' };
const ANY_CONTENT: SelOption = { label: 'Any Content', value: '' };
const ANY_DUB: SelOption = { label: 'Any Dub', value: '' };

const genreOptions: SelOption[] = toOptions(genreOptionsList);
const tagOptions: SelOption[] = toOptions(tagOptionsList);
const statusOptions: SelOption[] = [
  ANY_STATUS,
  ...toOptions(statusOptionsList),
];
const formatOptions: SelOption[] = [
  ANY_FORMAT,
  ...toOptions(formatOptionsList),
];
const seasonOptions: SelOption[] = [
  ANY_SEASON,
  ...toOptions(seasonOptionsList),
];
const sourceOptions: SelOption[] = [
  ANY_SOURCE,
  ...toOptions(sourceOptionsList),
];
const countryOptions: SelOption[] = [
  ANY_COUNTRY,
  ...Object.keys(countryNameMap).map((code) => ({
    label: countryNameMap[code],
    value: code,
  })),
];
const dubOptions: SelOption[] = [ANY_DUB, ...toOptions(dubLanguageOptionsList)];
const adultOptions: SelOption[] = [
  ANY_CONTENT,
  { label: 'Adult', value: true },
  { label: 'Non-Adult', value: false },
];
const sortOptions: SelOption[] = toOptions(sortOptionsList);
const yearOptions: SelOption[] = [
  ANY_YEAR,
  ...Array.from({ length: CURRENT_YEAR + 1 - 1939 }, (_, i) => ({
    label: String(CURRENT_YEAR + 1 - i),
    value: `${CURRENT_YEAR + 1 - i}%`,
  })),
];

// ---------------------------------------------------------------------------
// Styles — ported from live _filter*_90nii module classes.
// ---------------------------------------------------------------------------

const FilterContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 1rem;
  font-weight: 600;
  color: var(--global-text);
`;

const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActionLabel = styled.label`
  display: flex;
  flex-shrink: 0;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-around;
  margin: auto 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 300;
  white-space: nowrap;
  color: var(--global-text);
`;

const ActionButtonGroup = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  align-self: flex-start;
  justify-content: center;
  width: 100%;
  padding: 0.5rem 1rem;
  margin-top: auto;
  font-size: 0.9rem;
  color: var(--global-text);
  cursor: pointer;
  background-color: var(--global-div-tr);
  border: 1px solid transparent;
  outline: 1px solid var(--global-border-color);

  &:hover {
    color: var(--primary-accent);
    background-color: var(--primary-accent-tr, var(--global-tertiary-bg));
    filter: brightness(1.1);
    outline: none;
  }
  &:active {
    filter: brightness(1);
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.75rem;
  background-color: var(--global-div-tr);
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  transition: 0.1s ease-in-out;

  &:hover {
    border-color: var(--primary-accent);
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--primary-accent);
    cursor: grab;
  }
`;

const ScoreRange = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--global-text);
`;

const selectStyles: any = {
  placeholder: (provided: object) => ({
    ...provided,
    color: 'var(--global-text-muted)',
  }),
  singleValue: (provided: object, state: { data: SelOption }) => ({
    ...provided,
    color:
      typeof state.data.label === 'string' &&
      (state.data.label.startsWith('Any') ||
        state.data.label === 'Popularity')
        ? 'var(--global-text-muted)'
        : 'var(--primary-accent)',
  }),
  control: (provided: object) => ({
    ...provided,
    width: '100%',
    minHeight: '2.5rem',
    backgroundColor: 'var(--global-secondary-bg)',
    borderColor: 'transparent',
    color: 'var(--global-text)',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'var(--primary-accent)',
    },
  }),
  menu: (provided: object) => ({
    ...provided,
    zIndex: 5,
    padding: '0.25rem',
    backgroundColor: 'var(--global-secondary-bg)',
    borderColor: 'var(--global-border-color)',
    color: 'var(--global-text)',
  }),
  option: (
    provided: object,
    state: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...provided,
    backgroundColor:
      state.isSelected || state.isFocused
        ? 'var(--global-tertiary-bg)'
        : 'var(--global-secondary-bg)',
    color:
      state.isSelected || state.isFocused
        ? 'var(--primary-accent)'
        : 'var(--global-text)',
    borderRadius: 'var(--global-border-radius)',
    '&:hover': {
      backgroundColor: 'var(--global-tertiary-bg)',
      color: 'var(--primary-accent)',
    },
    marginBottom: '0.25rem',
  }),
  multiValue: (provided: object) => ({
    ...provided,
    backgroundColor: 'var(--global-tertiary-bg)',
  }),
  multiValueLabel: (provided: object) => ({
    ...provided,
    color: 'var(--global-text)',
  }),
  multiValueRemove: (provided: object) => ({
    ...provided,
    '&:hover': {
      backgroundColor: 'var(--primary-accent)',
      color: 'var(--global-secondary-bg)',
    },
  }),
  input: (provided: object) => ({
    ...provided,
    color: 'var(--global-text)',
  }),
};

// react-select with dynamic isMulti — type it as any to keep JSX simple.
const AnySelect: React.ComponentType<any> = Select as any;

interface FilterGroupRowProps {
  label: string;
  children: React.ReactNode;
}

const FilterGroupRow: React.FC<FilterGroupRowProps> = ({ label, children }) => (
  <FilterGroup>
    <FilterLabel>{label}</FilterLabel>
    {children}
  </FilterGroup>
);

// ---------------------------------------------------------------------------
// Filter form state (expanded section applies on "Apply", like live).
// ---------------------------------------------------------------------------

interface FilterForm {
  selectedTags: SelOption[];
  selectedGenres: SelOption[];
  selectedSort: SelOption[];
  selectedType: SelOption;
  selectedFormat: SelOption;
  selectedStatus: SelOption;
  selectedCountry: SelOption;
  selectedSeason: SelOption;
  selectedYear: SelOption;
  selectedSource: SelOption;
  selectedAdult: SelOption;
  averageScoreRange: [number, number];
  selectedDubLanguage: SelOption;
}

const typeOptions: SelOption[] = [
  { label: 'Any Type', value: '', isDisabled: true } as SelOption,
  { label: 'ANIME', value: 'ANIME' },
  { label: 'MANGA', value: 'MANGA', isDisabled: true } as SelOption,
];

const findOption = (
  options: SelOption[],
  value: string | boolean | undefined,
  fallback: SelOption,
): SelOption =>
  options.find((o) => o.value === (value ?? '')) ?? fallback;

const valuesToForm = (values: SearchFilterValues): FilterForm => ({
  selectedTags: values.tags.map((v) => ({ label: v, value: v })),
  selectedGenres: values.genres.map((v) => ({ label: v, value: v })),
  selectedSort: values.sort.map((v) => ({ label: v, value: v })),
  selectedType: findOption(typeOptions, values.type, typeOptions[1]),
  selectedFormat: findOption(formatOptions, values.format, ANY_FORMAT),
  selectedStatus: findOption(statusOptions, values.status, ANY_STATUS),
  selectedCountry: findOption(
    countryOptions,
    values.countryOfOrigin,
    ANY_COUNTRY,
  ),
  selectedSeason: findOption(seasonOptions, values.season, ANY_SEASON),
  selectedYear: findOption(yearOptions, values.startDate_like, ANY_YEAR),
  selectedSource: findOption(sourceOptions, values.source, ANY_SOURCE),
  selectedAdult: findOption(
    adultOptions,
    values.isAdult === undefined ? undefined : values.isAdult,
    ANY_CONTENT,
  ),
  averageScoreRange: [values.averageScore.min, values.averageScore.max],
  selectedDubLanguage: findOption(
    dubOptions,
    values.dubLanguage,
    ANY_DUB,
  ),
});

const defaultForm = (): FilterForm => valuesToForm(defaultFilterValues());

const formToValues = (form: FilterForm): SearchFilterValues => {
  const asString = (v: SelOption['value']): string | undefined =>
    typeof v === 'string' && v !== '' ? v : undefined;
  return {
    tags: form.selectedTags.map((o) => String(o.value)),
    genres: form.selectedGenres.map((o) => String(o.value)),
    sort: form.selectedSort.map((o) => String(o.value)),
    type: asString(form.selectedType.value) || 'ANIME',
    format: asString(form.selectedFormat.value),
    status: asString(form.selectedStatus.value),
    countryOfOrigin: asString(form.selectedCountry.value),
    season: asString(form.selectedSeason.value),
    startDate_like: asString(form.selectedYear.value),
    source: asString(form.selectedSource.value),
    isAdult:
      typeof form.selectedAdult.value === 'boolean'
        ? form.selectedAdult.value
        : undefined,
    averageScore: {
      min: form.averageScoreRange[0],
      max: form.averageScoreRange[1],
    },
    dubLanguage: asString(form.selectedDubLanguage.value),
  };
};

export const SearchFilters: React.FC<{
  currentFilters: SearchFilterValues;
  onFiltersChange: (filters: SearchFilterValues) => void;
}> = ({ currentFilters, onFiltersChange }) => {
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [formState, setFormState] = useState<FilterForm>(() =>
    valuesToForm(currentFilters),
  );

  // Live behavior: resizing collapses the expanded section unless the user
  // just toggled it (protected while interacting).
  useEffect(() => {
    const onResize = () => {
      if (!interacting) setShowExtraFilters(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [interacting]);

  const toggleExtraFilters = () => {
    setShowExtraFilters((prev) => !prev);
    setInteracting(true);
  };

  const resetFilters = () => {
    setFormState(defaultForm());
    onFiltersChange(defaultFilterValues());
  };

  const handleApplyFilters = () => {
    onFiltersChange(formToValues(formState));
  };

  const handleSingle =
    (key: keyof FilterForm, fallback: SelOption) => (value: any) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value ?? fallback,
      }));
    };

  const handleMulti =
    (key: 'selectedTags' | 'selectedGenres' | 'selectedSort') =>
    (value: any) => {
      setFormState((prev) => ({ ...prev, [key]: value ?? [] }));
    };

  const handleScore = (index: 0 | 1, raw: number) => {
    setFormState((prev) => {
      const next: [number, number] = [
        prev.averageScoreRange[0],
        prev.averageScoreRange[1],
      ];
      next[index] = raw;
      if (next[0] > next[1]) {
        if (index === 0) next[1] = next[0];
        else next[0] = next[1];
      }
      return { ...prev, averageScoreRange: next };
    });
  };

  return (
    <FilterContainer>
      {/* Basic group — order matches live: Genres, Tags, Year, Status, Format */}
      <FilterGroupRow label='Genres'>
        <AnySelect
          isMulti
          options={genreOptions}
          value={formState.selectedGenres}
          onChange={handleMulti('selectedGenres')}
          placeholder='Select Genres'
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
        />
      </FilterGroupRow>
      <FilterGroupRow label='Tags'>
        <AnySelect
          isMulti
          options={tagOptions}
          value={formState.selectedTags}
          onChange={handleMulti('selectedTags')}
          placeholder='Select Tags'
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
        />
      </FilterGroupRow>
      <FilterGroupRow label='Year'>
        <AnySelect
          options={yearOptions}
          value={formState.selectedYear}
          onChange={handleSingle('selectedYear', ANY_YEAR)}
          placeholder='Select Year'
          isClearable
          styles={selectStyles}
        />
      </FilterGroupRow>
      <FilterGroupRow label='Status'>
        <AnySelect
          options={statusOptions}
          value={formState.selectedStatus}
          onChange={handleSingle('selectedStatus', ANY_STATUS)}
          placeholder='Select Status'
          isClearable
          styles={selectStyles}
        />
      </FilterGroupRow>
      <FilterGroupRow label='Format'>
        <AnySelect
          options={formatOptions}
          value={formState.selectedFormat}
          onChange={handleSingle('selectedFormat', ANY_FORMAT)}
          placeholder='Select Format'
          isClearable
          styles={selectStyles}
        />
      </FilterGroupRow>

      {/* Expanded group — matches live "Expand Filters" section */}
      {showExtraFilters && (
        <>
          <FilterGroupRow label='Average Score'>
            <SliderWrapper>
              <input
                type='range'
                min={0}
                max={100}
                value={formState.averageScoreRange[0]}
                onChange={(e) => handleScore(0, Number(e.target.value))}
                aria-label='Minimum average score'
              />
              <input
                type='range'
                min={0}
                max={100}
                value={formState.averageScoreRange[1]}
                onChange={(e) => handleScore(1, Number(e.target.value))}
                aria-label='Maximum average score'
              />
              <ScoreRange>
                <span>
                  Min: <b>{formState.averageScoreRange[0]}</b>
                </span>
                <span>
                  Max: <b>{formState.averageScoreRange[1]}</b>
                </span>
              </ScoreRange>
            </SliderWrapper>
          </FilterGroupRow>
          <FilterGroupRow label='Season'>
            <AnySelect
              options={seasonOptions}
              value={formState.selectedSeason}
              onChange={handleSingle('selectedSeason', ANY_SEASON)}
              placeholder='Select Season'
              isClearable
              styles={selectStyles}
            />
          </FilterGroupRow>
          <FilterGroupRow label='Source Material'>
            <AnySelect
              options={sourceOptions}
              value={formState.selectedSource}
              onChange={handleSingle('selectedSource', ANY_SOURCE)}
              placeholder='Select Source'
              isClearable
              styles={selectStyles}
            />
          </FilterGroupRow>
          <FilterGroupRow label='Country of Origin'>
            <AnySelect
              options={countryOptions}
              value={formState.selectedCountry}
              onChange={handleSingle('selectedCountry', ANY_COUNTRY)}
              placeholder='Select Country'
              isClearable
              styles={selectStyles}
            />
          </FilterGroupRow>
          <FilterGroupRow label='Dub Language'>
            <AnySelect
              options={dubOptions}
              value={formState.selectedDubLanguage}
              onChange={handleSingle('selectedDubLanguage', ANY_DUB)}
              placeholder='Select Dub Language'
              isClearable
              styles={selectStyles}
            />
          </FilterGroupRow>
          <FilterGroupRow label='Adult Content'>
            <AnySelect
              options={adultOptions}
              value={formState.selectedAdult}
              onChange={handleSingle('selectedAdult', ANY_CONTENT)}
              placeholder='Select Adult Content'
              isClearable
              styles={selectStyles}
            />
          </FilterGroupRow>
          <FilterGroupRow label='Sort By'>
            <AnySelect
              isMulti
              options={sortOptions}
              value={formState.selectedSort}
              onChange={handleMulti('selectedSort')}
              placeholder='Select Sorting'
              closeMenuOnSelect={false}
              styles={selectStyles}
            />
          </FilterGroupRow>
        </>
      )}

      {/* Action group — Apply / Reset / Expand-Collapse, like live */}
      <ActionGroup>
        <ActionLabel>
          <span>Apply</span>
          <span>Reset</span>
          <span>{showExtraFilters ? 'Collapse' : 'Expand'}</span>
        </ActionLabel>
        <ActionButtonGroup>
          <ActionButton
            onClick={handleApplyFilters}
            aria-label='Apply Filters'
            title='Apply Filters'
          >
            <FiCheck size={20} />
          </ActionButton>
          <ActionButton
            onClick={resetFilters}
            aria-label='Reset Filters'
            title='Reset Filters'
          >
            <FaUndo size={18} />
          </ActionButton>
          <ActionButton
            onClick={toggleExtraFilters}
            aria-label={showExtraFilters ? 'Collapse Filters' : 'Expand Filters'}
            title={showExtraFilters ? 'Collapse Filters' : 'Expand Filters'}
          >
            {showExtraFilters ? (
              <FiChevronUp size={20} />
            ) : (
              <FiChevronDown size={20} />
            )}
          </ActionButton>
        </ActionButtonGroup>
      </ActionGroup>
    </FilterContainer>
  );
};
