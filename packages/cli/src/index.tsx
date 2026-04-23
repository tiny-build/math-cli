#!/usr/bin/env node
import { createRequire } from "node:module";
import { Box, render, Text, useApp } from "ink";
import { useEffect, useState } from "react";

const { version } = createRequire(import.meta.url)("../../package.json") as {
	version: string;
};

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const GRADIENT = [
	"#FF6B6B",
	"#FF8E53",
	"#FFC300",
	"#2ECC71",
	"#1ABC9C",
	"#3498DB",
	"#9B59B6",
	"#FF6B6B",
];

function Spinner() {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((f) => (f + 1) % FRAMES.length);
		}, 80);
		return () => clearInterval(timer);
	}, []);

	return <Text color="cyan">{FRAMES[frame]!}</Text>;
}

function AnimatedTitle() {
	const [colorIndex, setColorIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setColorIndex((i) => (i + 1) % GRADIENT.length);
		}, 200);
		return () => clearInterval(timer);
	}, []);

	return (
		<Text bold color={GRADIENT[colorIndex]!}>
			{"✦  math-cli  ✦"}
		</Text>
	);
}

function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCount((c) => c + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<Text>
			<Text color="gray">{"uptime: "}</Text>
			<Text color="yellow" bold>
				{`${count}s`}
			</Text>
		</Text>
	);
}

function App() {
	const { exit } = useApp();

	useEffect(() => {
		const onKey = (data: Buffer) => {
			const key = data.toString();
			if (key === "q" || key === "\x03") {
				exit();
			}
		};
		process.stdin.on("data", onKey);
		return () => {
			process.stdin.off("data", onKey);
		};
	}, [exit]);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={3}
			paddingY={1}
			gap={1}
		>
			<Box justifyContent="center">
				<AnimatedTitle />
			</Box>

			<Box gap={2} justifyContent="center">
				<Spinner />
				<Text color="gray">{"@tiny-build/math-cli"}</Text>
				<Spinner />
			</Box>

			<Box flexDirection="column" gap={0}>
				<Text>
					<Text color="green">{"✓ "}</Text>
					<Text color="white">{"Ready and running"}</Text>
				</Text>
				<Text>
					<Text color="blue">{"ℹ "}</Text>
					<Text color="white">{"Version "}</Text>
					<Text color="cyan">{version}</Text>
				</Text>
			</Box>

			<Box borderStyle="single" borderColor="gray" paddingX={2}>
				<Counter />
			</Box>

			<Text color="gray" dimColor>
				{"Press "}
				<Text color="white">{"q"}</Text>
				{" to exit"}
			</Text>
		</Box>
	);
}

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}

render(<App />);
