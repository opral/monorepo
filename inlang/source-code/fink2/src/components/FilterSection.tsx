import { useAtom } from "jotai";
import { searchQueryAtom, filteredLocalesAtom, settingsAtom, filterMissingTranslationAtom } from "../state.ts";
import { SlButton, SlInput, SlOption, SlSelect } from "@shoelace-style/shoelace/dist/react";

const FilterSection = () => {
  return (
    <div className="flex flex-wrap justify-between gap-2 mt-6">
      <div className="flex gap-2">
        <LanguageFilter />
        <MissingTranslationFilter />
      </div>
      <SearchInput />
    </div>
  )
}

export default FilterSection;

const LanguageFilter = () => {
  const [settings] = useAtom(settingsAtom);
  const [filteredLocales, setFilteredLocales] = useAtom(filteredLocalesAtom);
  return (
    <SlSelect
      className="w-fit-content min-w-40"
      placeholder="Filter languages"
      size="small"
      multiple
      clearable
      maxOptionsVisible={3}
      value={filteredLocales}
      onSlChange={
        // @ts-expect-error - shoelace event type
        (e) => setFilteredLocales(e.target.value)
      }>
      {settings?.locales.map((locale) => (
        <SlOption value={locale} key={locale}>
          {locale}
          {locale === settings?.baseLocale && (
            <div className="inline-block ml-2 bg-[--sl-input-placeholder-color] rounded px-2 py-0.5">
              <span className="after:content-['ref'] after:text-white" />
            </div>
          )}
        </SlOption>
      ))}
    </SlSelect>
  )
}

const MissingTranslationFilter = () => {
  const [filterMissingTranslation, setFilterMissingTranslation] = useAtom(filterMissingTranslationAtom);
  return (
    <SlButton
      size="small"
      variant={filterMissingTranslation ? "primary" : "default"}
      onClick={() => setFilterMissingTranslation(!filterMissingTranslation)}
    >
      Missing Translation
    </SlButton>
  )
}

const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  // @ts-expect-error - shoelace event type
  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div>
      <SlInput
        size="small"
        type="text"
        value={searchQuery}
        onInput={handleInputChange}
        placeholder="Search..."
      >
        <svg
          // @ts-expect-error - shoelace slot prop
          slot="suffix"
          className="w-5 h-5 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill={"var(--sl-input-placeholder-color)"}
        >
          <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
        </svg>
      </SlInput>
    </div>
  );
}
