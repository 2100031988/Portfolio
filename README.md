# Sabyasachi Kumar | Portfolio

A responsive, single-page developer portfolio presenting Sabyasachi Kumar's background, skills, projects, credentials, and contact options.

- **Live site:** [sabyakumar.me](https://sabyakumar.me)
- **Hosting model:** Static website configured for GitHub Pages with a custom domain
- **Repository type:** HTML, CSS, browser-side JavaScript, and static assets; no application server or build step is included

## Overview

The page is organized into six sections:

1. **Home** — introduction, CV link, and a short portfolio snapshot
2. **About** — education, work experience, and strengths
3. **Skills** — languages, machine-learning libraries, and tools
4. **Projects** — selected work with preview images, repository links, category filters, and keyword search
5. **Achievements** — research, certifications, competitions, sport, and community involvement
6. **Contact** — email and LinkedIn links plus a contact form

The page uses responsive layouts and local project/credential artwork. It includes browser-side interactions through `js/script.js`; this repository does not provide a server-side API or database.

## Technology

- **Markup:** HTML5
- **Styling:** Tailwind CSS via CDN, with site-specific rules in `css/style.css`
- **Icons:** Boxicons and Devicon via CDN
- **Fonts:** Space Grotesk and Bebas Neue via Google Fonts
- **Contact integration:** EmailJS Browser SDK is loaded by the page; actual delivery depends on the existing client-side configuration and the EmailJS service
- **Hosting:** GitHub Pages; `CNAME` identifies the custom domain

No React, Material UI, Node.js application server, admin dashboard, newsletter API, OTP service, or SQLite database is included in this repository.

## Run Locally

There are no package dependencies or build commands. Open `index.html` directly in a browser, or start a simple static server from the repository root:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Internet access is needed for the page's CDN-hosted styles, icons, fonts, and contact integration.

## Deploy

The repository is prepared for GitHub Pages and contains a `CNAME` for `sabyakumar.me`.

1. Push the site files to the configured GitHub repository.
2. In the repository's **Settings → Pages**, select the publishing branch and the repository root as the source.
3. Configure the custom domain as `sabyakumar.me` if it is not already set, and ensure the domain's DNS records point to GitHub Pages.
4. Allow GitHub Pages and DNS changes to finish propagating, then verify the live site and certificate links.

`robots.txt` and `sitemap.xml` are included for crawler discovery. Update the sitemap's `lastmod` value when the published site changes.

## Project Structure

```text
.
├── index.html
├── favicon.svg
├── CNAME
├── robots.txt
├── sitemap.xml
├── README.md
├── css/
│   ├── style.css
│   ├── bootstrap.min.css
│   └── fontawesome.min.css
├── js/
│   └── script.js
├── project_section_images/
│   ├── ai_face_swapper.jpeg
│   ├── autisium_detction.jpeg
│   ├── IOT_driver_drowisnesss.jpeg
│   └── numcompute-stream-social-preview.png
├── certifications_achievements_images/
│   ├── Fintech.png
│   ├── Redhat.png
│   ├── pcap.png
│   └── achievement illustration SVGs
├── license_codeofconduct/
│   ├── LICENSE
│   ├── CODE_OF_CONDUCT.md
│   └── SECURITY.md
└── .github/
    └── FUNDING.yml
```

The Bootstrap and Font Awesome stylesheets are present in `css/`; the current page loads Tailwind from its CDN and uses its own stylesheet.

## Privacy and Personal Materials

The page publishes personal and professional information, including a name, contact details, education and employment history, profile links, CV, certificates, and portfolio content. The contact form asks visitors for their name, email address, subject, and message. Do not submit sensitive information through the form. Contact-form processing is subject to the third-party EmailJS service and its privacy terms.

**Permission notice:** The Apache license for reusable source code does not grant permission to copy, publish, distribute, modify, or use the owner's identity or personal materials for another purpose. This includes the owner's name, likeness, contact information, CV, biography, employment or education details, certificates, certificate scans, personal photographs, original portfolio text, and other personal or credential assets. Obtain the owner's prior written consent before using those materials, unless a separate written license or applicable law permits the use.

This README records the owner's intended boundary between code and personal materials. For a legally enforceable asset-by-asset licensing policy, keep the scope consistent with the notices in `license_codeofconduct/LICENSE` and consult a qualified legal professional.

## License and Repository Policies

The included license text is **Apache License 2.0**, located at [`license_codeofconduct/LICENSE`](license_codeofconduct/LICENSE). It is not MIT. Review the permission notice above before reusing any personal or credential materials. Repository conduct and security guidance are in [`license_codeofconduct/CODE_OF_CONDUCT.md`](license_codeofconduct/CODE_OF_CONDUCT.md) and [`license_codeofconduct/SECURITY.md`](license_codeofconduct/SECURITY.md).
