import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { Hearts } from "../components/Hearts.js";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

const GLOW_COLORS: string[] = [theme.peach, theme.yellow, theme.pink, theme.mauve, theme.peach];

function glowAt(idx: number): string {
	return GLOW_COLORS[idx % GLOW_COLORS.length] ?? theme.peach;
}

export function Scene4Reassurance() {
	const [glowIdx, setGlowIdx] = useState(0);
	const lines = stanzas[3].lines;

	useEffect(() => {
		const timer = setInterval(() => {
			setGlowIdx((i) => (i + 1) % GLOW_COLORS.length);
		}, 350);
		return () => clearInterval(timer);
	}, []);

	const glow = glowAt(glowIdx);

	return (
		<Box flexDirection="column" gap={1}>
			<Hearts />
			<Box flexDirection="column" paddingX={2} gap={0}>
				{lines.map((line, i) => (
					<Text key={i} color={i === 0 ? glow : theme.text} bold={i === 0}>
						{line}
					</Text>
				))}
			</Box>
		</Box>
	);
}
