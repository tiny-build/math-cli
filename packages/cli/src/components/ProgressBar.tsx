import { Box, Text } from "ink";
import { theme } from "../theme.js";

interface Props {
	value: number; // 0..1
	width?: number;
	label?: string;
}

export function ProgressBar({ value, width = 20, label }: Props) {
	const filled = Math.round(value * width);
	const empty = width - filled;
	const bar = "▰".repeat(filled) + "▱".repeat(empty);

	return (
		<Box gap={1}>
			{label && <Text color={theme.subtext}>{label}</Text>}
			<Text color={theme.green}>{bar}</Text>
			<Text color={theme.overlay}>{`${Math.round(value * 100)}%`}</Text>
		</Box>
	);
}
