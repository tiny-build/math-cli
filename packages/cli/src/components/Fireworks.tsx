import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

const BURST_FRAMES = [
	["    ", "    ", " ✦  ", "    "],
	[" ✧  ", "  · ", " ✦  ", " ·  "],
	["✧ · ", " ⋆✦ ", "✦ ✧ ", " · ✸"],
	["✸·✧·", "·✦⋆✧", "✧·✸·", "⋆·✦·"],
	["·✸·✧", "✦·⋆·", "·✧·✸", "·✦·⋆"],
	["✧ · ", "  ✸ ", "·   ", " ✦  "],
	[" ·  ", "    ", " ✧  ", "    "],
];

const BURST_COLORS: string[] = [
	theme.yellow,
	theme.pink,
	theme.mauve,
	theme.peach,
	theme.green,
	theme.sky,
];

function colorAt(idx: number): string {
	return BURST_COLORS[idx % BURST_COLORS.length] ?? theme.pink;
}

export function Fireworks() {
	const [frameIdx, setFrameIdx] = useState(0);
	const [colorIdx, setColorIdx] = useState(0);

	useEffect(() => {
		const frameTimer = setInterval(() => {
			setFrameIdx((f) => (f + 1) % BURST_FRAMES.length);
		}, 120);
		const colorTimer = setInterval(() => {
			setColorIdx((c) => (c + 1) % BURST_COLORS.length);
		}, 200);
		return () => {
			clearInterval(frameTimer);
			clearInterval(colorTimer);
		};
	}, []);

	const frame = BURST_FRAMES[frameIdx] ?? BURST_FRAMES[0]!;

	return (
		<Box flexDirection="row" gap={2}>
			{([0, 2, 4] as const).map((offset) => (
				<Box key={offset} flexDirection="column">
					{frame.map((line, i) => (
						<Text key={i} color={colorAt(colorIdx + offset)}>
							{line}
						</Text>
					))}
				</Box>
			))}
		</Box>
	);
}
