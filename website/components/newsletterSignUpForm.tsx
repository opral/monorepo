function NewsletterSignUpForm() {
  return (
    <form
      id="contactform"
      action="https://formsubmit.io/send/ff1ad428-31d2-42e6-90d4-6ff971b91693"
      method="POST"
      className="py-3 sm:flex sm:max-w-md"
    >
      <input name="_formsubmit_id" type="text" style={{ display: "none" }} />
      <input
        className="w-full min-w-0 px-4 py-2 text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-500  rounded-md appearance-none dark:text-white sm:text-sm dark:border-gray-700 dark:bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:border-white focus:placeholder-gray-400"
        placeholder="your@email.com"
        name="email"
        type="email"
        id="email"
      />
      <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
        <div className="relative mt-3 rounded-md sm:mt-0 sm:ml-3">
          <button
            value="Submit"
            type="submit"
            className="no-underline flex items-center justify-center w-full px-8 py-3 font-mono text-sm font-medium text-gray-600 bg-black border border-transparent border-gray-200 rounded-md bg-opacity-5 dark:bg-white dark:text-gray-300 dark:border-gray-700 dark:bg-opacity-5 betterhover:hover:bg-gray-50 betterhover:dark:hover:bg-gray-900 md:py-3 md:text-base md:leading-6 md:px-10"
          >
            Subscribe
          </button>
        </div>
      </div>
    </form>
  );
}

export default NewsletterSignUpForm;
