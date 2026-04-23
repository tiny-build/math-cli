import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

interface Heart {
	id: number;
	x: number;
	y: number;
	char: string;
	color: string;
}

const HEART_CHARS = ["♥", "♡", "❤", "💕"];
const HEART_COLORS = [theme.pink, theme.red, theme.peach, theme.mauve];
const HEIGHT = 5;
const WIDTH = 40;

export function Hearts() {
	const [hearts, setHearts] = useState<Heart[]>([]);
	const [_tick, setTick] = useState(0);

	useEffect(() => {
		const spawnTimer = setInterval(() => {
			setHearts((prev) => {
				const filtered = prev.filter((h) => h.y > 0);
				if (filtered.length < 6) {
					filtered.push({
						id: Date.now(),
						x: Math.floor(Math.random() * WIDTH),
						y: HEIGHT - 1,
						char: HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)]!,
						color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]!,
					});
				}
				return filtered;
			});
		}, 600);

		const riseTimer = setInterval(() => {
			setTick((t) => t + 1);
			setHearts((prev) => prev.map((h) => ({ ...h, y: h.y - 1 })).filter((h) => h.y >= 0));
		}, 300);

		return () => {
			clearInterval(spawnTimer);
			clearInterval(riseTimer);
		};
	}, []);

	const grid: (Heart | null)[][] = Array.from({ length: HEIGHT }, () =>
		Array.from({ length: WIDTH }, () => null),
	);

	for (const h of hearts) {
		if (h.y >= 0 && h.y < HEIGHT && h.x >= 0 && h.x < WIDTH) {
			grid[h.y]![h.x] = h;
		}
	}

	return (
		<Box flexDirection="column">
			{grid.map((row, rowIdx) => (
				<Box key={rowIdx}>
					<Text>
						{row.map((cell, colIdx) =>
							cell ? (
								<Text key={colIdx} color={cell.color}>
									{cell.char}
								</Text>
							) : (
								<Text key={colIdx}> </Text>
							),
						)}
					</Text>
				</Box>
			))}
		</Box>
	);
}
