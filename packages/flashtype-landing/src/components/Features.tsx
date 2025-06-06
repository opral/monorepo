import { useState } from "react";
import AIFeature from "./features/AIFeature";
import MarkdownFeature from "./features/MarkdownFeature";
import ChangeControlFeature from "./features/ChangeControlFeature";

const Features = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(
    null
  );

  // Function to submit email to Google Forms
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Replace with your Google Form submission URL and entry ID
    // To get this: Create a Google Form with one "Short Answer" field for email,
    // then inspect the form's HTML to find the entry ID (looks like "entry.123456789")
    const formURL =
      "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfiSepEiOTgDELaLB6Sk5SV8WQmkDkIOdttjCz1Ja9T44pNVA/formResponse";
    const emailEntryId = "entry.274726745"; // Replace with your actual entry ID

    console.log("Submitting email to Google Form:", email);

    try {
      // Create a hidden iframe to handle the form submission
      // This approach avoids CORS issues that direct fetch would have
      const iframe = document.createElement("iframe");
      iframe.name = "hidden_iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      // Create a form element to submit
      const formElement = document.createElement("form");
      formElement.method = "POST";
      formElement.action = formURL;
      formElement.target = "hidden_iframe";

      // Add the email input to the form
      const emailInput = document.createElement("input");
      emailInput.type = "text";
      emailInput.name = emailEntryId;
      emailInput.value = email;
      formElement.appendChild(emailInput);

      // Add the form to the document, submit it, then remove it
      document.body.appendChild(formElement);
      formElement.submit();

      // Set a timeout to clean up the iframe and form
      setTimeout(() => {
        if (document.body.contains(formElement)) {
          document.body.removeChild(formElement);
        }
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);

      console.log("Form submission initiated");

      // Since we can't detect form submission status directly,
      // we assume success after a short delay
      setSubmitStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 px-4 relative">
      <div className="flex flex-col items-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8 yellow-glow-text relative inline-block">
          The Future of Writing
          {/* Glowy underline */}
          <span className="absolute left-1/2 -bottom-8 w-48 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent transform -translate-x-1/2"></span>
          <span className="absolute left-1/2 -bottom-8 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent transform -translate-x-1/2 blur-sm"></span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* AI Feature */}
        <div className="feature-card opacity-0 translate-y-10 transition-all duration-500 ease-out">
          <AIFeature />
        </div>

        {/* Markdown Feature */}
        <div className="feature-card opacity-0 translate-y-10 transition-all duration-500 ease-out delay-150">
          <MarkdownFeature />
        </div>

        {/* Change Control Feature */}
        <div className="feature-card opacity-0 translate-y-10 transition-all duration-500 ease-out delay-300">
          <ChangeControlFeature />
        </div>
      </div>

      {/* Massive Join Waitlist Section */}
      <div className="mt-40 mb-32 w-full px-4 relative">
        {/* Large background glow effect */}
        <div className="absolute inset-0 -top-40 -bottom-40 bg-gradient-radial from-yellow-500/15 to-transparent opacity-70 blur-3xl -z-10"></div>

        {/* Content */}
        <div className="text-center max-w-3xl mx-auto relative z-10">
          <h3 className="text-3xl md:text-4xl font-semibold mb-16 yellow-glow-text leading-tight relative inline-block">
            Join the Waitlist
            {/* Glowy underline */}
            <span className="absolute left-1/2 -bottom-8 w-64 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent transform -translate-x-1/2"></span>
            <span className="absolute left-1/2 -bottom-8 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/80 to-transparent transform -translate-x-1/2 blur-sm"></span>
          </h3>
          <p className="text-lg md:text-xl text-gray-300 mb-14 max-w-2xl mx-auto">
            Be among the first to experience a revolutionary writing environment
            with AI-powered assistance and collaborative editing.
          </p>

          {/* Email input and button - larger */}
          <form
            id="waitlist-form"
            onSubmit={handleSubmit}
            className="flex flex-col w-full gap-5 max-w-xl mx-auto mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-5 w-full">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 bg-black/40 border border-yellow-500/20 rounded-xl px-6 py-5 text-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 shadow-inner"
                required
                id="waitlist-email-input"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-8 py-5 rounded-xl transition-all duration-200 text-lg flex items-center justify-center gap-3 sm:w-auto w-full shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-[1.02] ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <span>{isSubmitting ? "Submitting..." : "Join Now"}</span>
                {!isSubmitting && (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 5L20 12L13 19M4 12H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Success/Error messages */}
            {submitStatus === "success" && (
              <div className="text-sm text-green-400 font-medium bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-lg">
                Thank you! Your email has been added to our waitlist.
              </div>
            )}
            {submitStatus === "error" && (
              <div className="text-sm text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
                Sorry, there was an error. Please try again or contact support.
              </div>
            )}
          </form>

          {/* Additional info */}
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-10">
            No spam. We'll notify you when early access is available. By
            joining, you agree to our privacy policy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
