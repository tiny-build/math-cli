import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

const CHARS = ["✦", "⋆", "·", "✧", "★", "✸"];
const COLORS = [theme.yellow, theme.pink, theme.mauve, theme.peach, theme.sky];

interface Sparkle {
	id: number;
	char: string;
	color: string;
	x: number;
	visible: boolean;
}

interface Props {
	count?: number;
	width?: number;
}

export function Sparkles({ count = 8, width = 40 }: Props) {
	const [sparkles, setSparkles] = useState<Sparkle[]>([]);

	useEffect(() => {
		const initial: Sparkle[] = Array.from({ length: count }, (_, i) => ({
			id: i,
			char: CHARS[Math.floor(Math.random() * CHARS.length)]!,
			color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
			x: Math.floor(Math.random() * width),
			visible: Math.random() > 0.5,
		}));
		setSparkles(initial);

		const timer = setInterval(() => {
			setSparkles((prev) =>
				prev.map((s) => ({
					...s,
					visible: Math.random() > 0.3,
					char: Math.random() > 0.8 ? CHARS[Math.floor(Math.random() * CHARS.length)]! : s.char,
				})),
			);
		}, 400);
		return () => clearInterval(timer);
	}, [count, width]);

	const row = Array.from({ length: width }, (_, i) => {
		const s = sparkles.find((sp) => sp.x === i);
		return s?.visible ? { char: s.char, color: s.color } : null;
	});

	return (
		<Box>
			<Text>
				{row.map((cell, i) =>
					cell ? (
						<Text key={i} color={cell.color}>
							{cell.char}
						</Text>
					) : (
						<Text key={i}> </Text>
					),
				)}
			</Text>
		</Box>
	);
}
