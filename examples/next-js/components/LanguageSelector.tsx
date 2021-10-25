import { useRouter } from "next/dist/client/router";

const LanguageSelector = () => {
  // router contains locale informations since Next.js uses i18n routing.
  // read more here https://nextjs.org/docs/advanced-features/i18n-routing
  const router = useRouter();

  return (
    <>
      <label>language: </label>
      <select
        value={router.locale}
        onChange={(event) => {
          // change just the locale and maintain all other route information including href's query
          router.push(
            { pathname: router.pathname, query: router.query },
            router.asPath,
            { locale: event.target.value }
          );
        }}
      >
        {/* show every locale as selection option */}
        {router.locales?.map((locale) => (
          <option key={locale} value={locale}>
            {locale}
          </option>
        ))}
      </select>
    </>
  );
};

export default LanguageSelector;
