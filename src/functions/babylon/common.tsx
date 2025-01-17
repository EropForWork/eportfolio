export const delay = (ms: number) =>
	new Promise(resolve => setTimeout(resolve, ms));

export const randomNumber = (min: number, max: number): number => {
	return Math.random() * (max - min) + min;
};

export function animateValue(
	from: number,
	to: number,
	duration: number
): (time: number) => number {
	if (isNaN(from) || isNaN(to)) {
		console.error('Invalid arguments for animateValue:', { from, to, duration });
		return () => NaN; // Возвращаем "пустую" функцию
	}
	return (time: number) => {
		const progress = Math.min(time / duration, 1);
		return from + (to - from) * progress;
	};
}
