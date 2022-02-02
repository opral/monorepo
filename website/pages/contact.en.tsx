function NewsletterSignUpForm() {
  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="contact" />
      <div hidden>
        <input name="bot-field" />
      </div>
      <p>
        <label>
          Your Name: <input type="text" name="name" />
        </label>
      </p>
      <p>
        <label>
          Your Email: <input type="email" name="email" />
        </label>
      </p>

      <p>
        <label>
          Message: <input name="message"></input>
        </label>
      </p>
      <p>
        <button type="submit">CONFIRM</button>
      </p>
    </form>
  );
}

export default NewsletterSignUpForm;
