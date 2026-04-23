export const theme = {
	base: "#1e1e2e",
	mantle: "#181825",
	text: "#cdd6f4",
	subtext: "#a6adc8",
	overlay: "#6c7086",
	pink: "#f5c2e7",
	mauve: "#cba6f7",
	red: "#f38ba8",
	peach: "#fab387",
	yellow: "#f9e2af",
	green: "#a6e3a1",
	teal: "#94e2d5",
	sky: "#89dceb",
	blue: "#89b4fa",
	lavender: "#b4befe",
} as const;

export const titleGradient: string[] = [
	theme.pink,
	theme.mauve,
	theme.lavender,
	theme.blue,
	theme.sky,
	theme.teal,
	theme.pink,
];

export function gradientColor(idx: number): string {
	return titleGradient[idx % titleGradient.length] ?? theme.pink;
}
