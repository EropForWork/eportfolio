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
	startRenderScene,
	triggerMouseMeshLogic
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
		loadedNodes,
		overedMesh,
		setOveredMesh,
		graphicModelsNames,
		registerActionsModelsNames
	} = useSkillsContext();

	const { state, engine, scene, light, models } = babylonProjectStates;

	const leaveCanvas = useCallback(() => {
		if (overedMesh) {
			triggerMouseMeshLogic(
				'OnPointerOutTrigger',
				overedMesh,
				startingTooltips,
				loadedNodes,
				setOveredMesh
			);
		}
	}, [overedMesh]);

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
					setBabylonProjectStates,
					graphicModelsNames
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
				setBabylonProjectStates,
				setOveredMesh,
				registerActionsModelsNames
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
