import {
	ArcRotateCamera,
	Vector3,
	EasingFunction,
	QuadraticEase,
	Animation,
	AnimationGroup,
	Scene
} from 'babylonjs';

export interface CameraPropsI {
	target: Vector3;
	alpha: number;
	beta: number;
	radius: number;
}

export const createCamera = async (
	scene: Scene,
	canvas: HTMLCanvasElement,
	startingCameraProps: CameraPropsI
): Promise<ArcRotateCamera> => {
	const camera = new ArcRotateCamera(
		'camera',
		0,
		0,
		startingCameraProps.radius,
		startingCameraProps.target,
		scene
	);
	camera.alpha = startingCameraProps.alpha;
	camera.beta = startingCameraProps.beta;
	camera.attachControl(canvas, true);
	return camera;
};

export const moveCamera = (
	camera: ArcRotateCamera,
	target?: Vector3,
	position?: { alpha?: number; beta?: number; radius?: number },
	duration: number = 1000
) => {
	const easingFunction = new QuadraticEase();
	easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

	const animationGroup = new AnimationGroup('cameraAnimationGroup');

	if (target) {
		const targetAnimation = new Animation(
			'cameraTargetAnimation',
			'target',
			60,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const keyFramesTarget = [
			{ frame: 0, value: camera.target },
			{ frame: (duration / 1000) * 60, value: target }
		];
		targetAnimation.setKeys(keyFramesTarget);
		targetAnimation.setEasingFunction(easingFunction);
		animationGroup.addTargetedAnimation(targetAnimation, camera);
	}

	if (position?.alpha !== undefined) {
		const alphaAnimation = new Animation(
			'cameraAlphaAnimation',
			'alpha',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const keyFramesAlpha = [
			{ frame: 0, value: camera.alpha },
			{ frame: (duration / 1000) * 60, value: position.alpha }
		];
		alphaAnimation.setKeys(keyFramesAlpha);
		alphaAnimation.setEasingFunction(easingFunction);
		animationGroup.addTargetedAnimation(alphaAnimation, camera);
	}

	if (position?.beta !== undefined) {
		const betaAnimation = new Animation(
			'cameraBetaAnimation',
			'beta',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const keyFramesBeta = [
			{ frame: 0, value: camera.beta },
			{ frame: (duration / 1000) * 60, value: position.beta }
		];
		betaAnimation.setKeys(keyFramesBeta);
		betaAnimation.setEasingFunction(easingFunction);
		animationGroup.addTargetedAnimation(betaAnimation, camera);
	}

	if (position?.radius !== undefined) {
		const radiusAnimation = new Animation(
			'cameraRadiusAnimation',
			'radius',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const keyFramesRadius = [
			{ frame: 0, value: camera.radius },
			{ frame: (duration / 1000) * 60, value: position.radius }
		];
		radiusAnimation.setKeys(keyFramesRadius);
		radiusAnimation.setEasingFunction(easingFunction);
		animationGroup.addTargetedAnimation(radiusAnimation, camera);
	}

	animationGroup.onAnimationGroupEndObservable.add(() => {
		animationGroup.dispose();
	});
	// TODO Включить перед продом
	// animationGroup.start(true);
	animationGroup.start(false);
};
