import { useEffect, useState, useRef, useCallback } from 'react';
import { useSkillsContext } from '../../app/SkillsContext';
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
} from '../../features/models';

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
		registerActionsModelsNames,
		gitGraphValues,
		removeNode
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
					graphicModelsNames,
					gitGraphValues
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
				registerActionsModelsNames,
				modelGroups,
				removeNode
			),
		processed: () => light && models && createShadows(setBabylonProjectStates),
		ready: () => {
			if (engine && scene) {
				startRenderScene(babylonProjectStates, setBabylonProjectStates);
				setCameraProps(startingCameraProps);
			}
		}
	};

	useEffect(() => {
		createBabylonjsActions[state]?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
