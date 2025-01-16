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
	const { babylonProjectStates, setBabylonProjectStates } = useSkillsContext();

	const { state, engine, scene, light, models } = babylonProjectStates;

	const createBabylonjsActions: Record<string, () => void> = {
		idle: () => {
			if (!hasInitialized && canvasRef.current) {
				setHasInitialized(true);
				createEngine(canvasRef.current, setBabylonProjectStates);
			}
		},
		initializing: () => engine && createScene(engine, setBabylonProjectStates),
		initialized: () => scene && createLight(scene, setBabylonProjectStates),
		loading: () => scene && createModels(scene, setBabylonProjectStates),
		loaded: () =>
			light && models && createShadows(light, models, setBabylonProjectStates),
		ready: () =>
			engine &&
			scene &&
			startRenderScene(babylonProjectStates, setBabylonProjectStates)
	};

	useEffect(() => {
		createBabylonjsActions[state]?.();
	}, [state]);

	return <canvas ref={canvasRef} className="avatar-container" />;
}

export default SkillsAvatar;
