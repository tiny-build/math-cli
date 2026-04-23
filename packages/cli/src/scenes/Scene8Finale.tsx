import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { Fireworks } from "../components/Fireworks.js";
import { stanzas } from "../poem.js";
import { gradientColor, theme } from "../theme.js";

const NAME_CHARS = ["M", "A", "T", "H", " ", "✦"];
const NAME_COLORS: string[] = [
	theme.pink,
	theme.mauve,
	theme.lavender,
	theme.blue,
	theme.sky,
	theme.yellow,
];

function nameColor(idx: number): string {
	return NAME_COLORS[idx % NAME_COLORS.length] ?? theme.pink;
}

export function Scene8Finale() {
	const lines = stanzas[7].lines;
	const [colorOffset, setColorOffset] = useState(0);
	const [showSignature, setShowSignature] = useState(false);
	const [sigColorIdx, setSigColorIdx] = useState(0);

	useEffect(() => {
		const nameTimer = setInterval(() => {
			setColorOffset((o) => (o + 1) % NAME_COLORS.length);
		}, 200);
		const sigTimer = setTimeout(() => setShowSignature(true), 1500);
		return () => {
			clearInterval(nameTimer);
			clearTimeout(sigTimer);
		};
	}, []);

	useEffect(() => {
		if (!showSignature) return;
		const timer = setInterval(() => {
			setSigColorIdx((i) => (i + 1) % 7);
		}, 300);
		return () => clearInterval(timer);
	}, [showSignature]);

	return (
		<Box flexDirection="column" gap={1} paddingX={2} alignItems="center">
			<Box flexDirection="row" gap={1} justifyContent="center">
				<Fireworks />
				<Box flexDirection="column" justifyContent="center" gap={1} paddingX={2}>
					<Box justifyContent="center">
						{NAME_CHARS.map((ch, i) => (
							<Text key={i} bold color={nameColor(i + colorOffset)}>
								{ch}
							</Text>
						))}
					</Box>
					<Box flexDirection="column" alignItems="center">
						{lines.map((line, i) => (
							<Text
								key={i}
								color={i === lines.length - 1 ? theme.yellow : theme.text}
								bold={i === lines.length - 1}
							>
								{line}
							</Text>
						))}
					</Box>
				</Box>
				<Fireworks />
			</Box>

			{showSignature && (
				<Box marginTop={1}>
					<Text color={gradientColor(sigColorIdx)} bold>
						{"made with 🌸 by Terminal Dude"}
					</Text>
				</Box>
			)}
		</Box>
	);
}
