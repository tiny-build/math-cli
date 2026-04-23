import { Text } from "ink";
import { useEffect, useState } from "react";

interface Props {
	text: string;
	speed?: number;
	color?: string;
	bold?: boolean;
	onDone?: () => void;
}

export function Typewriter({ text, speed = 40, color, bold, onDone }: Props) {
	const [revealed, setRevealed] = useState(0);

	useEffect(() => {
		setRevealed(0);
		const timer = setInterval(() => {
			setRevealed((r) => {
				if (r >= text.length) {
					clearInterval(timer);
					onDone?.();
					return r;
				}
				return r + 1;
			});
		}, speed);
		return () => clearInterval(timer);
	}, [text, speed, onDone]);

	return (
		<Text {...(color ? { color } : {})} {...(bold ? { bold } : {})}>
			{text.slice(0, revealed)}
		</Text>
	);
}
