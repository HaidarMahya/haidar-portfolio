# HAIDAR — Personal Portfolio
Install: `npm install` → Run: `npm run dev` → Build: `npm run build`

Sections (in order): Hero → About → Skills (interactive notebook) → Projects (poster archive + lightbox) → Contact (footer).
Edit content in `src/data.js`. Photos go in `public/images/`.

Theme tokens live in `src/index.css` (`cream`, `sun`, `ink`, `night`, `paper`, `beige`, `brown`, ...).
Each `<section>` declares `data-nav="light | sun | dark"` so the navbar changes colour with the section under it.
