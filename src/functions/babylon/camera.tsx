import { ArcRotateCamera, Vector3 } from 'babylonjs';

export const moveCamera = (
	camera: ArcRotateCamera,
	target?: Vector3,
	position?: { alpha?: number; beta?: number; radius?: number }
) => {
	if (target) {
		camera.setTarget(target);
	}

	if (position) {
		const { alpha, beta, radius } = position;
		camera.radius = radius ?? camera.radius;
		camera.alpha = alpha ?? camera.alpha;
		camera.beta = beta ?? camera.beta;
	}
};
