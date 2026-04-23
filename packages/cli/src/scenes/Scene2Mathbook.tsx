import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { Sparkles } from "../components/Sparkles.js";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

const LAPTOP_FRAMES = [
	[
		"  ┌──────────────┐  ",
		"  │ > _ ▌       │  ",
		"  │               │  ",
		"  └──────────────┘  ",
		" ╰──────────────────╯ ",
	],
	[
		"  ┌──────────────┐  ",
		"  │ > _          │  ",
		"  │  ✦           │  ",
		"  └──────────────┘  ",
		" ╰──────────────────╯ ",
	],
	[
		"  ┌──────────────┐  ",
		"  │ > _ ▌       │  ",
		"  │     ⋆        │  ",
		"  └──────────────┘  ",
		" ╰──────────────────╯ ",
	],
];

export function Scene2Mathbook() {
	const [frameIdx, setFrameIdx] = useState(0);
	const lines = stanzas[1].lines;

	useEffect(() => {
		const timer = setInterval(() => {
			setFrameIdx((f) => (f + 1) % LAPTOP_FRAMES.length);
		}, 500);
		return () => clearInterval(timer);
	}, []);

	const frame = LAPTOP_FRAMES[frameIdx]!;

	return (
		<Box flexDirection="column" gap={1}>
			<Sparkles count={10} width={50} />
			<Box flexDirection="row" gap={3} paddingX={2}>
				<Box flexDirection="column">
					{frame.map((line, i) => (
						<Text key={i} color={i === 0 || i === 3 || i === 4 ? theme.blue : theme.teal}>
							{line}
						</Text>
					))}
				</Box>
				<Box flexDirection="column" justifyContent="center">
					{lines.map((line, i) => (
						<Text key={i} color={i % 2 === 0 ? theme.text : theme.lavender}>
							{line}
						</Text>
					))}
				</Box>
			</Box>
			<Sparkles count={8} width={50} />
		</Box>
	);
}
