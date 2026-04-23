import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

export function Scene7Motivation() {
	const lines = stanzas[6].lines;
	const [visibleLines, setVisibleLines] = useState(0);
	const [breathe, setBreathe] = useState(false);

	useEffect(() => {
		const timers = lines.map((_, i) =>
			setTimeout(() => setVisibleLines((v) => Math.max(v, i + 1)), i * 700),
		);
		let breathInterval: ReturnType<typeof setInterval> | null = null;
		const breathTimer = setTimeout(
			() => {
				breathInterval = setInterval(() => setBreathe((b) => !b), 1200);
			},
			lines.length * 700 + 300,
		);

		return () => {
			for (const t of timers) clearTimeout(t);
			clearTimeout(breathTimer);
			if (breathInterval) clearInterval(breathInterval);
		};
	}, [lines.length, lines.map]);

	return (
		<Box flexDirection="column" gap={1} paddingX={2}>
			<Box justifyContent="center">
				<Text color={breathe ? theme.lavender : theme.mauve} bold>
					{"~ open your Mathbook ~"}
				</Text>
			</Box>
			<Box flexDirection="column" gap={0}>
				{lines.map((line, i) => (
					<Box key={i}>
						{i < visibleLines ? (
							<Text
								color={i === lines.length - 1 ? theme.pink : theme.lavender}
								bold={i === lines.length - 1}
							>
								{line}
							</Text>
						) : (
							<Text color={theme.overlay}>{"·".repeat(line.length)}</Text>
						)}
					</Box>
				))}
			</Box>
			{visibleLines >= lines.length && (
				<Box justifyContent="center" marginTop={1}>
					<Text color={breathe ? theme.pink : theme.mauve}>
						{"♥  the code you write echoes your heart  ♥"}
					</Text>
				</Box>
			)}
		</Box>
	);
}
