import React, { useEffect, useRef } from 'react';
import { babylonProjectStatesI, useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	ArcRotateCamera,
	Color3,
	Color4,
	DirectionalLight,
	Engine,
	Mesh,
	MeshBuilder,
	Scene,
	ShadowGenerator,
	StandardMaterial,
	Tools,
	Vector3
} from 'babylonjs';

const SkillsAvatar: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { selectedSkill, setBabylonProjectStates } = useSkillsContext();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const createScene = async (engine: Engine): Promise<Scene> => {
			const scene = new Scene(engine);
			scene.clearColor = new Color4(0, 0, 0, 0);
			return scene;
		};

		const createCamera = async (
			scene: Scene,
			canvas: HTMLCanvasElement
		): Promise<ArcRotateCamera> => {
			const camera = new ArcRotateCamera(
				'camera',
				Math.PI / 2,
				Math.PI / 2,
				5,
				new Vector3(0, 0, 0),
				scene
			);
			camera.beta = Tools.ToRadians(50);
			camera.setTarget(Vector3.Zero());
			camera.attachControl(canvas, true);
			return camera;
		};

		const createLight = async (scene: Scene): Promise<DirectionalLight> => {
			const light = new DirectionalLight('dir01', new Vector3(-1, -2, 0), scene);
			light.position = new Vector3(0, 5, 0);
			light.intensity = 10;
			return light;
		};

		const createModels = async (scene: Scene): Promise<Mesh[]> => {
			const box = MeshBuilder.CreateBox('box', {}, scene);
			box.position.y = 1;
			box.position.x = 2;

			const ground = MeshBuilder.CreateGround(
				'ground',
				{ width: 6, height: 6 },
				scene
			);
			ground.position.x = 2;

			box.material = new StandardMaterial('boxMaterial', scene);
			(box.material as StandardMaterial).emissiveColor = new Color3(0.7, 0.7, 0.7);

			ground.material = new StandardMaterial('groundMaterial', scene);
			(ground.material as StandardMaterial).emissiveColor = new Color3(
				0.5,
				0.5,
				0.5
			);

			return [box, ground];
		};

		const createShadows = async (
			light: DirectionalLight,
			models: Mesh[]
		): Promise<ShadowGenerator> => {
			const shadowGenerator = new ShadowGenerator(1024, light);
			shadowGenerator.useBlurExponentialShadowMap = true;
			shadowGenerator.blurKernel = 32;
			models.forEach(model => {
				shadowGenerator.addShadowCaster(model);
				model.receiveShadows = true;
			});
			return shadowGenerator;
		};

		const createBabylonProject = async (canvas: HTMLCanvasElement) => {
			const engine = new Engine(canvas, true);
			const scene = await createScene(engine);
			const camera = await createCamera(scene, canvas);
			const light = await createLight(scene).catch(() => null);
			const models = await createModels(scene).catch(() => null);
			const shadows =
				light && models
					? await createShadows(light, models).catch(() => null)
					: null;

			setBabylonProjectStates((prevState: babylonProjectStatesI) => ({
				...prevState,
				engine,
				scene,
				camera,
				light: light || prevState.light,
				models: models || prevState.models,
				shadows: shadows || prevState.shadows
			}));

			engine.runRenderLoop(() => {
				scene.render();
			});

			window.addEventListener('resize', () => {
				engine.resize();
			});

			return () => {
				engine.dispose();
			};
		};

		createBabylonProject(canvas);
	}, [setBabylonProjectStates]);

	useEffect(() => {
		if (selectedSkill) {
			console.log(`Selected skill: ${selectedSkill}`);
		}
	}, [selectedSkill]);

	return <canvas ref={canvasRef} className="avatar-container" />;
};

export default SkillsAvatar;
