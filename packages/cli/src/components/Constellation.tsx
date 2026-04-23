import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

interface Star {
	x: number;
	y: number;
	char: string;
}

interface Cell {
	char: string;
	color: string;
}

const WIDTH = 44;
const HEIGHT = 5;

const FIXED_STARS: Star[] = [
	{ x: 2, y: 0, char: "✦" },
	{ x: 8, y: 2, char: "⋆" },
	{ x: 14, y: 1, char: "★" },
	{ x: 20, y: 3, char: "·" },
	{ x: 26, y: 0, char: "✧" },
	{ x: 32, y: 2, char: "✦" },
	{ x: 38, y: 1, char: "⋆" },
	{ x: 5, y: 4, char: "·" },
	{ x: 17, y: 4, char: "✧" },
	{ x: 29, y: 4, char: "★" },
	{ x: 41, y: 3, char: "✦" },
];

export function Constellation() {
	const [phase, setPhase] = useState<"twinkling" | "connecting">("twinkling");
	const [visibleStars, setVisibleStars] = useState<Set<number>>(new Set());
	const [connectorTick, setConnectorTick] = useState(0);

	useEffect(() => {
		let i = 0;
		const revealTimer = setInterval(() => {
			if (i < FIXED_STARS.length) {
				setVisibleStars((prev) => new Set([...prev, i]));
				i++;
			} else {
				clearInterval(revealTimer);
				setTimeout(() => setPhase("connecting"), 400);
			}
		}, 150);
		return () => clearInterval(revealTimer);
	}, []);

	useEffect(() => {
		if (phase !== "connecting") return;
		const timer = setInterval(() => {
			setConnectorTick((t) => t + 1);
		}, 200);
		return () => clearInterval(timer);
	}, [phase]);

	const twinkleOffset = connectorTick % 2 === 0;

	const grid: (Cell | null)[][] = Array.from({ length: HEIGHT }, () =>
		Array.from<Cell | null>({ length: WIDTH }).fill(null),
	);

	FIXED_STARS.forEach((star, idx) => {
		if (visibleStars.has(idx)) {
			const twinkling = phase === "twinkling" || (idx % 2 === 0 ? twinkleOffset : !twinkleOffset);
			grid[star.y]![star.x] = {
				char: twinkling ? star.char : "·",
				color: twinkling ? theme.yellow : theme.overlay,
			};
		}
	});

	if (phase === "connecting" && connectorTick > 2) {
		const connectorCount = Math.min(Math.floor((connectorTick - 2) / 2), FIXED_STARS.length - 1);
		for (let i = 0; i < connectorCount; i++) {
			const a = FIXED_STARS[i]!;
			const b = FIXED_STARS[i + 1]!;
			const midX = Math.floor(a.x + (b.x - a.x) / 2);
			if (midX >= 0 && midX < WIDTH && a.y < HEIGHT) {
				grid[a.y]![midX] = { char: "─", color: theme.lavender };
			}
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
