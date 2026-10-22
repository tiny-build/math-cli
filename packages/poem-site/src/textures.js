import { CanvasTexture, SRGBColorSpace } from "three";

const canvasTexture = (size, draw, height = size) => {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = height;
	draw(canvas.getContext("2d"), size, height);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
};

export const dotTexture = () =>
	canvasTexture(64, (ctx, s) => {
		const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(0.35, "rgba(255,255,255,0.85)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, s, s);
	});

export const glowTexture = () =>
	canvasTexture(256, (ctx, s) => {
		const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(0.12, "rgba(255,255,255,0.95)");
		g.addColorStop(0.2, "rgba(255,255,255,0.45)");
		g.addColorStop(0.45, "rgba(255,255,255,0.12)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, s, s);
	});

export const rayTexture = () =>
	canvasTexture(
		64,
		(ctx, w, h) => {
			const along = ctx.createLinearGradient(0, h, 0, 0);
			along.addColorStop(0, "rgba(255,240,215,0.9)");
			along.addColorStop(0.5, "rgba(255,200,210,0.25)");
			along.addColorStop(1, "rgba(255,200,210,0)");
			ctx.fillStyle = along;
			ctx.fillRect(0, 0, w, h);
			// Feather the long edges.
			ctx.globalCompositeOperation = "destination-in";
			const across = ctx.createLinearGradient(0, 0, w, 0);
			across.addColorStop(0, "rgba(0,0,0,0)");
			across.addColorStop(0.5, "rgba(0,0,0,1)");
			across.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = across;
			ctx.fillRect(0, 0, w, h);
		},
		256,
	);

export const petalTexture = () =>
	canvasTexture(64, (ctx, s) => {
		ctx.translate(s / 2, s / 2);
		ctx.rotate(-0.6);
		const g = ctx.createRadialGradient(0, -4, 2, 0, 0, s / 2.4);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(1, "rgba(255,255,255,0.75)");
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.ellipse(0, 0, s / 5, s / 2.6, 0, 0, Math.PI * 2);
		ctx.fill();
	});

export const glyphTexture = (glyph) =>
	canvasTexture(128, (ctx, s) => {
		const halo = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
		halo.addColorStop(0, "rgba(255,255,255,0.55)");
		halo.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = halo;
		ctx.fillRect(0, 0, s, s);
		ctx.font = `italic 600 ${s * 0.62}px Fraunces, Georgia, serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.shadowColor = "rgba(255,90,150,0.9)";
		ctx.shadowBlur = 14;
		ctx.fillStyle = "#fff6fa";
		ctx.fillText(glyph, s / 2, s / 2 + s * 0.04);
	});
