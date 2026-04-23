import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

export function Scene3Doubt() {
	const [flickerPhase, setFlickerPhase] = useState<"dark" | "mid" | "steady">("dark");
	const lines = stanzas[2].lines;

	useEffect(() => {
		const timers = [
			setTimeout(() => setFlickerPhase("mid"), 400),
			setTimeout(() => setFlickerPhase("dark"), 700),
			setTimeout(() => setFlickerPhase("mid"), 1000),
			setTimeout(() => setFlickerPhase("dark"), 1200),
			setTimeout(() => setFlickerPhase("mid"), 1500),
			setTimeout(() => setFlickerPhase("steady"), 2000),
		];
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, []);

	const textColor =
		flickerPhase === "dark" ? theme.overlay : flickerPhase === "mid" ? theme.subtext : theme.text;

	const borderColor =
		flickerPhase === "dark" ? theme.overlay : flickerPhase === "mid" ? theme.red : theme.mauve;

	return (
		<Box flexDirection="column" gap={1} paddingX={2}>
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor={borderColor}
				paddingX={2}
				paddingY={1}
			>
				{lines.map((line, i) => (
					<Text key={i} color={textColor} dimColor={flickerPhase !== "steady"}>
						{flickerPhase === "dark" && i % 2 === 1 ? "· · · · · · · · · · ·" : line}
					</Text>
				))}
			</Box>
		</Box>
	);
}
