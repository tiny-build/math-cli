#!/usr/bin/env node
import { Box, render, Text, useApp, useInput } from "ink";
import { useEffect, useState } from "react";
import { Header } from "./components/Header.js";
import { IntroLoader } from "./components/IntroLoader.js";
import { Path } from "./components/Path.js";
import {
	Scene1Opening,
	Scene2Mathbook,
	Scene3Doubt,
	Scene4Reassurance,
	Scene5Journey,
	Scene6Constellations,
	Scene7Motivation,
	Scene8Finale,
} from "./scenes/index.js";
import { theme } from "./theme.js";

const SCENES = [
	Scene1Opening,
	Scene2Mathbook,
	Scene3Doubt,
	Scene4Reassurance,
	Scene5Journey,
	Scene6Constellations,
	Scene7Motivation,
	Scene8Finale,
] as const;

const TOTAL = SCENES.length;
const MIN_COLS = 60;

function App() {
	const { exit } = useApp();
	const [phase, setPhase] = useState<"intro" | "show">("intro");
	const [sceneIndex, setSceneIndex] = useState(0);
	const [replayKey, setReplayKey] = useState(0);
	const [goodbye, setGoodbye] = useState(false);
	const [cols, setCols] = useState(process.stdout.columns ?? 80);

	useEffect(() => {
		const onResize = () => setCols(process.stdout.columns ?? 80);
		process.stdout.on("resize", onResize);
		return () => {
			process.stdout.off("resize", onResize);
		};
	}, []);

	useInput((input, key) => {
		if (goodbye) return;

		if (input === "q" || key.escape) {
			setGoodbye(true);
			setTimeout(() => exit(), 1200);
			return;
		}

		if (phase !== "show") return;

		if ((key.rightArrow || input === " ") && sceneIndex < TOTAL - 1) {
			setSceneIndex((i) => i + 1);
			setReplayKey((k) => k + 1);
			return;
		}

		if (key.leftArrow && sceneIndex > 0) {
			setSceneIndex((i) => i - 1);
			setReplayKey((k) => k + 1);
			return;
		}

		if (input === "r") {
			setReplayKey((k) => k + 1);
		}
	});

	if (goodbye) {
		return (
			<Box flexDirection="column" alignItems="center" gap={1} paddingY={1}>
				<Text bold color={theme.pink}>
					{"✦ goodbye, Math ✦"}
				</Text>
				<Text color={theme.peach}>{"go build something beautiful today 💕"}</Text>
				<Text color={theme.overlay} dimColor>
					{"made with 🌸 by Terminal Dude"}
				</Text>
			</Box>
		);
	}

	if (cols < MIN_COLS) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color={theme.peach}>{"the stage needs a bit more room —"}</Text>
				<Text color={theme.subtext}>{" please widen the terminal 💕"}</Text>
			</Box>
		);
	}

	if (phase === "intro") {
		return (
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor={theme.mauve}
				paddingX={2}
				paddingY={1}
			>
				<IntroLoader onDone={() => setPhase("show")} />
			</Box>
		);
	}

	const CurrentScene = SCENES[sceneIndex]!;

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={theme.mauve}
			paddingX={2}
			paddingY={1}
			gap={1}
		>
			<Header sceneIndex={sceneIndex} totalScenes={TOTAL} />

			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={theme.overlay}
				paddingX={1}
				paddingY={1}
				minHeight={12}
			>
				<Box flexDirection="column" key={replayKey}>
					<CurrentScene />
				</Box>
			</Box>

			<Path sceneIndex={sceneIndex} totalScenes={TOTAL} />

			<Box justifyContent="center">
				<Text color={theme.overlay} dimColor>
					{"← → or space navigate  ·  r replay  ·  q quit"}
				</Text>
			</Box>
		</Box>
	);
}

render(<App />);
