function NewsletterSignUpForm() {
  return (
    <form name="newsletter" method="POST" data-netlify="true">
      <p>
        <label>
          Your Email: <input type="email" name="email" />
        </label>
      </p>
      <p>
        <button type="submit">Send</button>
      </p>
    </form>
  );
}

export default NewsletterSignUpForm;
