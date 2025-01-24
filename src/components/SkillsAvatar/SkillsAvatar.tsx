import { useEffect, useState, useRef, useCallback } from 'react';
import { useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	createEngine,
	createLight,
	createScene,
	createShadows,
	loadUserModels,
	processingUserModels,
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
		setCameraProps,
		modelGroups,
		addNode,
		loadedNodes
	} = useSkillsContext();

	const { state, engine, scene, light, models } = babylonProjectStates;

	const leaveCanvas = useCallback(() => {
		if (startingTooltips.length > 0) {
			startingTooltips.forEach(tooltip => {
				tooltip.methods?.hide?.();
				// TODO запустить уход с меша
			});
		}
	}, []);

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
		loading: () => {
			if (scene) {
				loadUserModels(
					startingLoadingModels,
					scene,
					modelGroups,
					setBabylonProjectStates
				).finally(() => {
					scene.getNodes().forEach(node => {
						addNode(node.name, { node: node });
					});
				});
			}
		},
		loaded: () =>
			scene &&
			models &&
			processingUserModels(
				scene,
				loadedNodes,
				models,
				startingTooltips,
				loadingAnimationModelsNames,
				meshStartingPropsObject,
				addNode,
				setBabylonProjectStates
			),
		processed: () =>
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
