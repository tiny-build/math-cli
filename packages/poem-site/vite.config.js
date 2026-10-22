import { defineConfig } from "vite";

// GitHub Pages serves project sites from https://<owner>.github.io/<repo>/.
// Both values can be overridden from the environment (the Pages workflow does this).
const REPO = "demo-repository";
const BASE_PATH = process.env.BASE_PATH ?? `/${REPO}/`;
const SITE_URL = (process.env.SITE_URL ?? `https://tiny-build.github.io${BASE_PATH}`).replace(
	/\/?$/,
	"/",
);

// Open Graph scrapers need absolute URLs, so inject the public site URL into index.html.
const siteUrl = () => ({
	name: "inject-site-url",
	transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", SITE_URL),
});

export default defineConfig({
	base: BASE_PATH,
	plugins: [siteUrl()],
	build: {
		target: "es2022",
		chunkSizeWarningLimit: 900,
	},
});
