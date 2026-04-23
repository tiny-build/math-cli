import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { stanzas } from "../poem.js";
import { gradientColor, theme } from "../theme.js";

export function Scene1Opening() {
	const [colorIdx, setColorIdx] = useState(0);
	const [revealed, setRevealed] = useState(0);
	const lines = stanzas[0].lines;
	const fullText = lines.join("\n");

	useEffect(() => {
		const timer = setInterval(() => {
			setColorIdx((i) => (i + 1) % 7);
		}, 250);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		setRevealed(0);
		const timer = setInterval(() => {
			setRevealed((r) => {
				if (r >= fullText.length) {
					clearInterval(timer);
					return r;
				}
				return r + 1;
			});
		}, 25);
		return () => clearInterval(timer);
	}, [fullText]);

	const shown = fullText.slice(0, revealed);
	const shownLines = shown.split("\n");

	return (
		<Box flexDirection="column" gap={1}>
			<Box justifyContent="center">
				<Text bold color={gradientColor(colorIdx)}>
					{"✦ ✦ ✦  A Stroll Through the Mathbook  ✦ ✦ ✦"}
				</Text>
			</Box>
			<Box flexDirection="column" paddingX={2}>
				{lines.map((_line, i) => (
					<Text key={i} color={i === 0 ? theme.pink : theme.text} bold={i === 0}>
						{shownLines[i] ?? ""}
					</Text>
				))}
			</Box>
			<Box justifyContent="center">
				<Text color={theme.overlay} dimColor>
					{"· · · press → to continue · · ·"}
				</Text>
			</Box>
		</Box>
	);
}
