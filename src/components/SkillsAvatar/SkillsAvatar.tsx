import { useEffect, useState, useRef } from 'react';
import { useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	createEngine,
	createLight,
	createModels,
	createScene,
	createShadows,
	startRenderScene
} from '../../functions/babylon/models';

function SkillsAvatar() {
	const [hasInitialized, setHasInitialized] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const {
		babylonProjectStates,
		setBabylonProjectStates,
		loadingAnimationModelsNames,
		meshStartingPropsObject,
		startingTooltips,
		startingLoadingModels,
		startingCameraProps,
		setCameraProps
	} = useSkillsContext();

	const { state, engine, scene, light, models } = babylonProjectStates;

	function leaveCanvas() {
		if (startingTooltips.length > 0) {
			startingTooltips.forEach(tooltip => {
				tooltip.methods?.hide?.();
			});
		}
	}

	const createBabylonjsActions: Record<string, () => void> = {
		idle: () => {
			if (!hasInitialized && canvasRef.current) {
				setHasInitialized(true);
				createEngine(canvasRef.current, setBabylonProjectStates);
			}
		},
		initializing: () =>
			engine && createScene(engine, setBabylonProjectStates, startingCameraProps),
		initialized: () => scene && createLight(scene, setBabylonProjectStates),
		loading: () =>
			scene &&
			createModels(
				scene,
				setBabylonProjectStates,
				startingLoadingModels,
				loadingAnimationModelsNames,
				meshStartingPropsObject,
				startingTooltips
			),
		loaded: () =>
			light && models && createShadows(light, models, setBabylonProjectStates),
		ready: () => {
			if (engine && scene) {
				startRenderScene(babylonProjectStates, setBabylonProjectStates);
				setCameraProps(startingCameraProps);
			}
		}
	};

	useEffect(() => {
		createBabylonjsActions[state]?.();
	}, [state]);

	return (
		<canvas
			ref={canvasRef}
			className="avatar-container"
			onMouseLeave={leaveCanvas}
		/>
	);
}

export default SkillsAvatar;
