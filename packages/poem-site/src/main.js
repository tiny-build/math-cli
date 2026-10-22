import "./style.css";

// Scroll timeline (0 → 1). The weather in mood.js is keyed to these ranges.
const INTRO_END = 0.07;
const OUTRO_START = 0.93;
const LINE_START = 0.08; // local stanza progress where the first line appears
const LINE_STEP = 0.17; // …and the gap between lines
const STANZA_LEAVE = 0.92; // local progress where a stanza drifts away

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const intro = document.querySelector(".intro");
const outro = document.querySelector(".outro");
const stanzas = [...document.querySelectorAll(".stanza")];
const rail = document.querySelector(".rail");
const loader = document.getElementById("loader");
const span = (OUTRO_START - INTRO_END) / stanzas.length;

// --- Split each verse into words for the staggered reveal -------------------

const splitWords = (el) => {
	let i = 0;
	const walk = (node) => {
		for (const child of [...node.childNodes]) {
			if (child.nodeType === Node.TEXT_NODE) {
				const frag = document.createDocumentFragment();
				for (const part of child.textContent.split(/(\s+)/)) {
					if (!part) continue;
					if (/^\s+$/.test(part)) {
						frag.append(" ");
						continue;
					}
					const w = document.createElement("span");
					w.className = "w";
					w.style.setProperty("--i", i++);
					w.textContent = part;
					frag.append(w);
				}
				child.replaceWith(frag);
			} else {
				walk(child);
			}
		}
	};
	walk(el);
};

for (const line of document.querySelectorAll(".line")) splitWords(line);

// --- Stanza rail ------------------------------------------------------------

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

const scrollToProgress = (p) =>
	window.scrollTo({ top: p * maxScroll(), behavior: reducedMotion ? "auto" : "smooth" });

const railButtons = stanzas.map((stanza, i) => {
	const button = document.createElement("button");
	button.type = "button";
	button.setAttribute("aria-label", `Go to ${stanza.getAttribute("aria-label").toLowerCase()}`);
	button.addEventListener("click", () => scrollToProgress(INTRO_END + span * (i + 0.72)));
	rail.append(button);
	return button;
});

// --- Outro actions ----------------------------------------------------------

document
	.querySelector('[data-action="replay"]')
	.addEventListener("click", () => scrollToProgress(0));

const shareButton = document.querySelector('[data-action="share"]');
shareButton.addEventListener("click", async () => {
	const data = {
		title: document.title,
		text: "Someone made you a weather report ☀️",
		url: location.href,
	};
	try {
		if (navigator.share) await navigator.share(data);
		else {
			await navigator.clipboard.writeText(location.href);
			shareButton.textContent = "Link copied ✦";
			setTimeout(() => {
				shareButton.textContent = "Share the sunshine";
			}, 2200);
		}
	} catch {
		// Share sheet dismissed — nothing to do.
	}
});

// --- Text timeline ----------------------------------------------------------

const setActive = (el, active, leaving = false) => {
	el.classList.toggle("is-active", active);
	el.classList.toggle("is-leaving", leaving);
};

const updateText = (p) => {
	setActive(intro, p < INTRO_END * 0.75, p >= INTRO_END * 0.75);
	setActive(outro, p >= OUTRO_START + 0.01);

	stanzas.forEach((stanza, i) => {
		const t = (p - (INTRO_END + i * span)) / span;
		const inside = t >= 0 && t < 1;
		setActive(stanza, inside && t < STANZA_LEAVE, inside && t >= STANZA_LEAVE);
		railButtons[i].classList.toggle("is-active", inside);
		stanza.querySelectorAll(".line").forEach((line, k) => {
			line.classList.toggle("is-on", t >= LINE_START + k * LINE_STEP);
		});
	});

	root.style.setProperty("--p", p.toFixed(4));
};

// --- Scroll → smoothed progress → frame -------------------------------------

let target = 0;
let current = 0;
const readScroll = () => {
	const max = maxScroll();
	target = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
};
window.addEventListener("scroll", readScroll, { passive: true });
window.addEventListener("resize", readScroll);
readScroll();
current = target;

const hideLoader = () => loader.classList.add("done");

const start = async () => {
	let world = null;
	try {
		// Wait briefly for fonts so the 3D glyph sprites use Fraunces.
		await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
		const { createWorld } = await import("./scene.js");
		world = createWorld(document.getElementById("scene"));
	} catch (error) {
		console.warn("WebGL unavailable — falling back to a flat sky.", error);
		root.classList.add("no-webgl");
	}

	let last = performance.now();
	let first = true;
	const frame = (now) => {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		current += (target - current) * (1 - Math.exp(-dt * (reducedMotion ? 14 : 4.5)));
		if (Math.abs(target - current) < 0.00005) current = target;
		updateText(current);
		if (world) {
			world.setProgress(current);
			world.render(dt);
		}
		if (first) {
			first = false;
			requestAnimationFrame(hideLoader);
		}
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
};

start();
