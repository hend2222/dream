DreamWings updated project

Start:
- Extract the ZIP.
- Open the folder in VS Code and run home.html with Live Server (not file://).
- Ensure Firebase Authentication Email/Password and Google providers are enabled.

New features:
- Compact profile button in the navbar and matching home logo dimensions.
- Profile avatar upload and selectable emoji avatars.
- Profile counters use local reading/favorites/listening data.
- Book Studio: upload a cover image, PDF, story text, and optional narrator audio.
- Uploaded book records appear in the Fantasy collection; PDF and audio controls appear in Read & Listen.
- Contact form writes messages to Firestore.
- About page comments and ratings write to Firestore and load from it.
- Polished sign-in prompt for protected categories/features.

IMPORTANT:
Follow FIREBASE_RULES_SETUP.txt before testing photo uploads, book uploads, comments, and contact messages.
Book Studio is intentionally owner-only. Set ADMIN_UID in book-admin.js and the matching rules.
Contact messages are saved to Firestore; they are not emailed automatically.


UPDATE NOTES (Nov 2026)
- Fantasy collection now loads book-admin.js so the Edit/Delete handlers are available on that page.
- Admin module safely runs on pages that do not contain the Book Studio form.
- Story text is optional when uploading; when supplied, it is paginated inside reader.html.
- PDF remains optional storage/archive and is not used as the interactive reader.
- Narration plays only from the audioUrl uploaded by the owner. Browser text-to-speech and automatic sounds are disabled.
- Existing books without story text must be edited and given storyText to show readable pages.


UPDATE NOTES (Story illustrations)
- Book Studio now accepts multiple optional story illustration images.
- Upload illustrations in story order: image 1 corresponds to story page 1, image 2 to story page 2, etc.
- The reader displays each story text page on the left and its matching illustration on the facing right page.
- Edit supports replacing the illustration set; leaving the illustration upload empty preserves the saved illustrations.
- Fantasy category removes old hard-coded sample covers/shelf rows. Only Firebase-uploaded fantasy books are shown.

UPDATE v4: Reader opens on the closed front cover first. Open book button reveals the pages. Desktop book has a fixed 850x520 stage and fixed page height; long text scrolls inside its page so the book does not resize. Reader accepts illustrationUrls, storyIllustrations, or illustrations arrays. Upload pickers explicitly support multiple images and show the selected count/order.

UPDATE v5: Story is text-only and required; PDF upload removed from Book Studio and upload logic. Illustrations are added one at a time with an Add another image button (unlimited count subject to storage), with remove controls and order previews; same sequential picker added to Edit. Reader CSS now enforces display:none on hidden illustration image to prevent hidden empty img overriding [hidden], and keeps failed image loads on placeholder. Successful upload shows short toast; sign-in success toasts now dismiss after ~2.2 seconds.

UPDATE v7 – Firebase permissions, upload CORS and six exact categories:
- The six library shelves are now selectable as separate categories: Space & Stars,
  Secret Kingdoms, Time Portals, Kind Hearts, Little Scientist, Sleepy Star Dreams.
- New books save the selected category ID. Category pages query exact equality on
  book.category, so a book only appears in its selected category.
- The built-in six choices remain visible even when Firestore categories listing is
  denied. Custom categories need the categories read/write rule.
- Fixed submit authorization so it uses the already verified admin state rather
  than additionally rejecting the owner when a secondary UID check mismatches.
- See FIREBASE_RULES_SETUP.txt and storage-cors.json. Firestore Rules, Storage Rules,
  and bucket CORS must be published/configured in Firebase/Google Cloud Console.
