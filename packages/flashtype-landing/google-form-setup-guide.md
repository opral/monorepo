# Google Form Setup Guide for FlashType Waitlist

This guide walks you through setting up a Google Form to collect email addresses for the FlashType waitlist.

## Step 1: Create a Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Click on the "+" icon to create a new form
3. Name your form "FlashType Waitlist"
4. Add a short description about FlashType (optional)

## Step 2: Add an Email Field

1. Add a "Short answer" question
2. Set the question to "Email Address"
3. Click on "Required" to make this field mandatory
4. (Optional) Add email validation:
   - Click the three dots in the question
   - Select "Response validation"
   - Choose "Regular expression" and enter: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
   - Set error message: "Please enter a valid email address"

## Step 3: Configure Form Settings

1. Click the gear icon (⚙️) to open Settings
2. In the "General" tab:
   - Uncheck "Collect email addresses" (we're already collecting them in our form)
   - Check "Limit to 1 response" (optional)
3. In the "Presentation" tab:
   - Add a confirmation message like "Thanks for joining the FlashType waitlist! We'll notify you when early access is available."
4. Click "Save"

## Step 4: Get Form URL and Entry ID

1. Click "Send" at the top right
2. Copy the form URL (we'll need this)
3. To get the entry ID:
   - Click the three dots in the top right
   - Select "Get pre-filled link"
   - Enter any test value in the Email field
   - Click "Get Link"
   - Copy the generated link
   - Look for the parameter that looks like `entry.XXXXXXXXX` in the URL - the number after "entry." is your entry ID

## Step 5: Update Code in Features.tsx

1. Open `/packages/flashtype-landing/src/components/Features.tsx`
2. Find the following code section:
```javascript
// Replace with your Google Form submission URL and entry ID
const formURL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfiSepEiOTgDELaLB6Sk5SV8WQmkDkIOdttjCz1Ja9T44pNVA/formResponse";
const emailEntryId = "entry.274726745"; // Replace with your actual entry ID
```
3. Replace the `formURL` with your Google Form URL, modified as follows:
   - Change the end of the URL from `/viewform` to `/formResponse`
4. Replace the `emailEntryId` with the entry ID you obtained in Step 4

## Testing the Integration

1. Launch the FlashType landing page locally:
```bash
pnpm --filter flashtype-landing dev
```

2. Try submitting an email through the waitlist form
3. Check your Google Form responses to verify submissions are working:
   - Go to your Google Form
   - Click "Responses" at the top

## Troubleshooting

- **No Submissions Appearing:** Make sure the form URL and entry ID are correct
- **CORS Errors:** The iframe approach should avoid CORS issues, but if problems persist, you might need to use a backend proxy or service like Zapier
- **Form Validation Issues:** Check the Google Form settings to ensure validation rules aren't preventing submissions

## Next Steps

- Consider setting up email notifications for new submissions
- Export responses to a Google Sheet for easier management
- Set up automated confirmation emails to users who join the waitlist