import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

interface Props {
	sceneIndex: number;
	totalScenes: number;
}

const PATH_WIDTH = 44;
const SPRITE_WIDTH = 5;

type Frame = readonly [string, string, string, string, string];

const STAND: Frame = [" ⋆   ", " ◝ω◜ ", "/|♡|\\", " | | ", " d b "] as const;

const WALK_A: Frame = ["  ⋆  ", " ◝ω◜ ", " |♡|>", "<| |>", " d b "] as const;

const WALK_B: Frame = ["⋆    ", " ◝ω◜ ", "<|♡| ", "<| |>", " b d "] as const;

const ROW_COLORS: string[] = [theme.yellow, theme.peach, theme.pink, theme.mauve, theme.lavender];

function rowColor(i: number): string {
	return ROW_COLORS[i] ?? theme.pink;
}

export function Path({ sceneIndex, totalScenes }: Props) {
	const targetPos = Math.floor(
		(sceneIndex / Math.max(totalScenes - 1, 1)) * (PATH_WIDTH - SPRITE_WIDTH),
	);

	const [frameIdx, setFrameIdx] = useState(0);
	const [spritePos, setSpritePos] = useState(targetPos);

	useEffect(() => {
		if (spritePos === targetPos) return;
		const frameTimer = setInterval(() => {
			setFrameIdx((f) => (f + 1) % 2);
		}, 140);
		const moveTimer = setInterval(() => {
			setSpritePos((p) => {
				if (p < targetPos) return p + 1;
				if (p > targetPos) return p - 1;
				clearInterval(moveTimer);
				return p;
			});
		}, 35);
		return () => {
			clearInterval(frameTimer);
			clearInterval(moveTimer);
		};
	}, [targetPos, spritePos]);

	useEffect(() => {
		if (spritePos === targetPos) setFrameIdx(0);
	}, [spritePos, targetPos]);

	const frame: Frame = spritePos === targetPos ? STAND : frameIdx === 0 ? WALK_A : WALK_B;

	const buildDotRow = () => {
		let row = "";
		for (let i = 0; i < PATH_WIDTH; i++) {
			row += i % 3 === 0 ? "·" : " ";
		}
		return row;
	};

	const leftPad = " ".repeat(spritePos);
	const rightPadWidth = Math.max(0, PATH_WIDTH - spritePos - SPRITE_WIDTH);
	const rightPad = " ".repeat(rightPadWidth);

	return (
		<Box flexDirection="column">
			{frame.map((line, i) => (
				<Box key={i}>
					<Text color={rowColor(i)}>
						{leftPad}
						{line}
						{rightPad}
					</Text>
				</Box>
			))}
			<Box>
				<Text color={theme.overlay}>{buildDotRow()}</Text>
			</Box>
		</Box>
	);
}
