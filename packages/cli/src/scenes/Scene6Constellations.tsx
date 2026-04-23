import { Box, Text } from "ink";
import { Constellation } from "../components/Constellation.js";
import { stanzas } from "../poem.js";
import { theme } from "../theme.js";

export function Scene6Constellations() {
	const lines = stanzas[5].lines;

	return (
		<Box flexDirection="column" gap={1} paddingX={2}>
			<Box justifyContent="center">
				<Text color={theme.yellow} bold>
					{"~ a year and a half of stars ~"}
				</Text>
			</Box>
			<Constellation />
			<Box flexDirection="column" gap={0}>
				{lines.map((line, i) => (
					<Text key={i} color={i === 1 ? theme.yellow : theme.text}>
						{line}
					</Text>
				))}
			</Box>
		</Box>
	);
}
