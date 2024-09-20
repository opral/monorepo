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
        <SlOption value={locale}>
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
      />
    </div>
  );
}
