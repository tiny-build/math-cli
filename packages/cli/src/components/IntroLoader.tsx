import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { introLoaders } from "../loaders.js";
import { gradientColor, theme } from "../theme.js";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const MESSAGE_DURATION = 4200;

interface Props {
	onDone: () => void;
}

export function IntroLoader({ onDone }: Props) {
	const [messageIdx, setMessageIdx] = useState(0);
	const [spinnerIdx, setSpinnerIdx] = useState(0);
	const [colorIdx, setColorIdx] = useState(0);

	useEffect(() => {
		const spinTimer = setInterval(() => {
			setSpinnerIdx((i) => (i + 1) % SPINNER.length);
		}, 80);
		const colorTimer = setInterval(() => {
			setColorIdx((i) => (i + 1) % 7);
		}, 200);
		return () => {
			clearInterval(spinTimer);
			clearInterval(colorTimer);
		};
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (messageIdx >= introLoaders.length - 1) {
				onDone();
				return;
			}
			setMessageIdx((i) => i + 1);
		}, MESSAGE_DURATION);
		return () => clearTimeout(timer);
	}, [messageIdx, onDone]);

	const message = introLoaders[messageIdx] ?? introLoaders[0]!;

	return (
		<Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={3} gap={2}>
			<Text bold color={gradientColor(colorIdx)}>
				{"✦ ✦ ✦  for Math, with 🌸  ✦ ✦ ✦"}
			</Text>
			<Box gap={2}>
				<Text color={theme.pink}>{SPINNER[spinnerIdx]}</Text>
				<Text color={theme.mauve}>{message}</Text>
				<Text color={theme.pink}>{SPINNER[spinnerIdx]}</Text>
			</Box>
			<Box gap={1}>
				{introLoaders.map((_, i) => (
					<Text key={i} color={i <= messageIdx ? theme.pink : theme.overlay}>
						{i <= messageIdx ? "●" : "○"}
					</Text>
				))}
			</Box>
		</Box>
	);
}
