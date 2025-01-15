import { useEffect, useRef } from 'react';
import { useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import { createBabylonProject } from '../../functions/babylon/models';

function SkillsAvatar() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { babylonProjectStates, setBabylonProjectStates } = useSkillsContext();

	useEffect(() => {
		if (babylonProjectStates.scene) {
			babylonProjectStates.scene.debugLayer.show({
				handleResize: false,
				overlay: true
			});
		}
	}, [babylonProjectStates.scene]);

	useEffect(() => {
		const { current: canvas } = canvasRef;
		if (!canvas) return;
		createBabylonProject(canvas, setBabylonProjectStates);
	}, [canvasRef]);
	return <canvas ref={canvasRef} className="avatar-container" />;
}

export default SkillsAvatar;
