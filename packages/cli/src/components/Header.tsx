import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { gradientColor, theme } from "../theme.js";

interface Props {
	sceneIndex: number;
	totalScenes: number;
}

export function Header({ sceneIndex, totalScenes }: Props) {
	const [colorIdx, setColorIdx] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setColorIdx((i) => (i + 1) % 7);
		}, 300);
		return () => clearInterval(timer);
	}, []);

	const dots = Array.from({ length: totalScenes }, (_, i) => {
		if (i < sceneIndex) return "●";
		if (i === sceneIndex) return "◉";
		return "○";
	}).join(" ");

	return (
		<Box flexDirection="column" alignItems="center" gap={0}>
			<Text bold color={gradientColor(colorIdx)}>
				{"✦  for Math, with 🌸  ✦"}
			</Text>
			<Box gap={2}>
				<Text color={theme.overlay} dimColor>
					{dots}
				</Text>
				<Text color={theme.subtext}>{`${sceneIndex + 1} / ${totalScenes}`}</Text>
			</Box>
		</Box>
	);
}
