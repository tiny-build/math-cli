import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

export function Scene7Motivation() {
	const lines = stanzas[6].lines;
	const [visibleLines, setVisibleLines] = useState(0);

	useEffect(() => {
		const timers = lines.map((_, i) =>
			setTimeout(() => setVisibleLines((v) => Math.max(v, i + 1)), i * 700),
		);
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, [lines.map]);

	return (
		<Box flexDirection="column" gap={1} paddingX={2}>
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
		</Box>
	);
}
