import { Color } from "three";

// The scene's "weather" keyed to scroll progress (0 → 1). Each keyframe only lists
// what changes; everything else carries over from the previous one.
// Stanza ranges live in main.js — keep the two in step.
const KEYFRAMES = [
	{
		// A world full of bugs, bad design and despair.
		at: 0,
		skyTop: "#3d2b4f",
		skyMid: "#8c6b8c",
		skyBottom: "#c8a0b2",
		fog: "#9f8299",
		sun: "#ffb199",
		sunY: -70,
		sunIntensity: 0.2,
		fogNear: 20,
		fogFar: 190,
		exposure: 0.85,
		bugs: 1,
		color: 0,
		storm: 0.55,
		snow: 0,
		embers: 0,
		petals: 0,
		questions: 0,
		rays: 0,
		lift: 0,
	},
	{ at: 0.085, storm: 0.6 },
	{
		// "There was Math, spreading sunshine and fixing the air."
		at: 0.14,
		skyTop: "#f58cb7",
		skyMid: "#ffc3d8",
		skyBottom: "#ffe6d5",
		fog: "#ffd2dd",
		sun: "#fff0d6",
		sunY: 60,
		sunIntensity: 1.15,
		fogNear: 40,
		fogFar: 320,
		exposure: 1.05,
		bugs: 0,
		color: 1,
		storm: 0,
		embers: 0.25,
	},
	{ at: 0.22, sunY: 70, embers: 0.15 },
	{
		// "But lately, things haven't felt right…"
		at: 0.3,
		skyTop: "#7f6f95",
		skyMid: "#b7a0b8",
		skyBottom: "#d9c2cb",
		fog: "#bfa8ba",
		sun: "#f3d7d9",
		sunY: 25,
		sunIntensity: 0.45,
		fogNear: 24,
		fogFar: 220,
		exposure: 0.9,
		color: 0.45,
		storm: 0.85,
		embers: 0,
	},
	{ at: 0.4, storm: 1, sunIntensity: 0.32 },
	{
		// "A cloudy forecast doesn't cancel December."
		at: 0.47,
		skyTop: "#9d8fbf",
		skyMid: "#d5c5e0",
		skyBottom: "#f4e3ee",
		fog: "#e2d3e6",
		sun: "#ffe9f0",
		sunY: 30,
		sunIntensity: 0.5,
		fogNear: 26,
		fogFar: 240,
		exposure: 1,
		snow: 1,
		storm: 0.8,
		color: 0.6,
	},
	{ at: 0.55, snow: 0.85, sunIntensity: 0.75, storm: 0.45 },
	{
		// "So keep asking questions…"
		at: 0.61,
		skyTop: "#ff9cc4",
		skyMid: "#ffcadb",
		skyBottom: "#ffeadc",
		fog: "#ffd6e0",
		sun: "#fff3dc",
		sunY: 45,
		sunIntensity: 1,
		fogNear: 40,
		fogFar: 320,
		exposure: 1.05,
		snow: 0,
		storm: 0.1,
		color: 1,
		questions: 1,
		embers: 0.4,
	},
	{ at: 0.72, questions: 0.9, embers: 0.6 },
	{ at: 0.765, questions: 0.15 },
	{
		// "You're Math — the creator, the spark, and the flame."
		at: 0.82,
		skyTop: "#ff6fae",
		skyMid: "#ffad8f",
		skyBottom: "#ffe2b0",
		fog: "#ffc7b5",
		sun: "#ffe7b0",
		sunY: 55,
		sunIntensity: 1.8,
		fogNear: 50,
		fogFar: 360,
		exposure: 1.12,
		storm: 0,
		questions: 0,
		embers: 1,
		petals: 1,
		rays: 1,
		lift: 0.55,
	},
	{ at: 0.95, lift: 1, sunIntensity: 2 },
	{ at: 1 },
];

const COLOR_KEYS = ["skyTop", "skyMid", "skyBottom", "fog", "sun"];

// Fill in carried-over values and pre-parse colours once.
const FRAMES = [];
for (const frame of KEYFRAMES) {
	const prev = FRAMES.at(-1) ?? {};
	const full = { ...prev, ...frame };
	for (const key of COLOR_KEYS) {
		if (typeof full[key] === "string") full[key] = new Color(full[key]);
	}
	FRAMES.push(full);
}

const ease = (t) => t * t * (3 - 2 * t);

const out = Object.fromEntries(
	Object.keys(FRAMES[0]).map((k) => [k, COLOR_KEYS.includes(k) ? new Color() : 0]),
);

export function moodAt(p) {
	let i = 0;
	while (i < FRAMES.length - 2 && FRAMES[i + 1].at <= p) i++;
	const a = FRAMES[i];
	const b = FRAMES[i + 1];
	const t = ease(Math.min(Math.max((p - a.at) / (b.at - a.at || 1), 0), 1));
	for (const key in out) {
		if (key === "at") continue;
		if (COLOR_KEYS.includes(key)) out[key].copy(a[key]).lerp(b[key], t);
		else out[key] = a[key] + (b[key] - a[key]) * t;
	}
	return out;
}
