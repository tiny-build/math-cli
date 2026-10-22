// Renders the link-preview image and touch icon from SVG sources into public/.
// Requires `rsvg-convert` (macOS: `brew install librsvg`, Debian/Ubuntu: `apt install librsvg2-bin`).
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public");

const render = (input, output, size) => {
	execFileSync("rsvg-convert", [...size, "-o", output, input], { stdio: "inherit" });
	console.log(`✓ ${output}`);
};

try {
	render(resolve(here, "og-image.svg"), resolve(pub, "og-image.png"), ["-w", "1200", "-h", "630"]);
	render(resolve(pub, "favicon.svg"), resolve(pub, "apple-touch-icon.png"), [
		"-w",
		"180",
		"-h",
		"180",
	]);
} catch (error) {
	console.error("Could not run rsvg-convert — is librsvg installed?", error.message);
	process.exit(1);
}
