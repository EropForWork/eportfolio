export const delay = (ms: number) =>
	new Promise(resolve => setTimeout(resolve, ms));

export const randomNumber = (min: number, max: number): number => {
	return Math.random() * (max - min) + min;
};
