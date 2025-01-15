import { useEffect, useRef } from 'react';
import { useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	createBabylonProject,
	resumeCreateBabylonProject
} from '../../functions/babylon/models';

function SkillsAvatar() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { babylonProjectStates, setBabylonProjectStates } = useSkillsContext();

	useEffect(() => {
		if (babylonProjectStates.engine) {
			resumeCreateBabylonProject(
				canvasRef.current!,
				babylonProjectStates.engine,
				setBabylonProjectStates
			);
		}
	}, [babylonProjectStates.engine]);

	useEffect(() => {
		const { current: canvas } = canvasRef;
		if (!canvas) return;
		createBabylonProject(canvas, setBabylonProjectStates);
	}, [canvasRef]);
	return <canvas ref={canvasRef} className="avatar-container" />;
}

export default SkillsAvatar;
