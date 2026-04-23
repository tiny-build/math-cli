const messages = [
	"wait da — buffering for your tiny yet crazy brain…",
	"thinking of how to annoy you…",
	"recompiling feelings…",
	"fetching sparkles from the void…",
	"asking the stars nicely…",
	"loading stanza.exe with love…",
	"polishing the next scene…",
	"tying ribbons on the pixels…",
];

export function pickLoader(): string {
	return messages[Math.floor(Math.random() * messages.length)]!;
}
