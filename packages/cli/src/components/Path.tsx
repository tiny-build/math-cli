import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme.js";

interface Props {
	walking: boolean;
	sceneIndex: number;
	totalScenes: number;
}

const PATH_WIDTH = 44;
const SPRITE_WIDTH = 3;

const FRAME_A = [" o ", "/|\\", "/ \\"];
const FRAME_B = [" o ", "/|\\", " \\\\"];

export function Path({ walking, sceneIndex, totalScenes }: Props) {
	const [frame, setFrame] = useState<"A" | "B">("A");
	const [spritePos, setSpritePos] = useState(() =>
		Math.floor((sceneIndex / Math.max(totalScenes - 1, 1)) * (PATH_WIDTH - SPRITE_WIDTH)),
	);

	const targetPos = Math.floor(
		(sceneIndex / Math.max(totalScenes - 1, 1)) * (PATH_WIDTH - SPRITE_WIDTH),
	);

	useEffect(() => {
		if (!walking) {
			setSpritePos(targetPos);
			setFrame("A");
			return;
		}
		const frameTimer = setInterval(() => {
			setFrame((f) => (f === "A" ? "B" : "A"));
		}, 150);
		const moveTimer = setInterval(() => {
			setSpritePos((p) => {
				if (p < targetPos) return p + 1;
				if (p > targetPos) return p - 1;
				return p;
			});
		}, 35);
		return () => {
			clearInterval(frameTimer);
			clearInterval(moveTimer);
		};
	}, [walking, targetPos]);

	const spriteLines = frame === "A" ? FRAME_A : FRAME_B;

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
			<Box>
				<Text color={theme.pink}>
					{leftPad}
					{spriteLines[0]}
					{rightPad}
				</Text>
			</Box>
			<Box>
				<Text color={theme.pink}>
					{leftPad}
					{spriteLines[1]}
					{rightPad}
				</Text>
			</Box>
			<Box>
				<Text color={theme.overlay}>{buildDotRow()}</Text>
			</Box>
		</Box>
	);
}
