import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { ProgressBar } from "../components/ProgressBar.js";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

export function Scene5Journey() {
	const [progress, setProgress] = useState(0);
	const lines = stanzas[4].lines;

	useEffect(() => {
		const timer = setInterval(() => {
			setProgress((p) => {
				if (p >= 1) {
					clearInterval(timer);
					return 1;
				}
				return Math.min(p + 0.02, 1);
			});
		}, 40);
		return () => clearInterval(timer);
	}, []);

	const labelText =
		progress < 0.5 ? "I can't…" : progress < 1 ? "getting there…" : "I found a way ✦";

	return (
		<Box flexDirection="column" gap={1} paddingX={2}>
			<Box flexDirection="column" gap={0}>
				{lines.map((line, i) => (
					<Text key={i} color={i === 3 ? theme.green : theme.text}>
						{line}
					</Text>
				))}
			</Box>
			<Box flexDirection="column" gap={0} paddingX={1}>
				<ProgressBar value={progress} width={24} label={labelText} />
			</Box>
		</Box>
	);
}
