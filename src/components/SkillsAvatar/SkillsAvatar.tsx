import React, { useEffect, useRef } from 'react';
import { babylonProjectStatesI, useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	AbstractMesh,
	ArcRotateCamera,
	Color4,
	DirectionalLight,
	Engine,
	HDRCubeTexture,
	Mesh,
	Scene,
	ShadowGenerator,
	Tools,
	Vector3
} from 'babylonjs';
import {
	changeMeshVisibility,
	loadModels
} from '../../functions/babylon/models';

const SkillsAvatar: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { setBabylonProjectStates } = useSkillsContext();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const createScene = async (engine: Engine): Promise<Scene> => {
			const scene = new Scene(engine);
			scene.clearColor = new Color4(0, 0, 0, 0);
			scene.debugLayer.show({ handleResize: false, overlay: true });
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
				10,
				new Vector3(0, 0.5, 0.5),
				scene
			);
			camera.alpha = Tools.ToRadians(250);
			camera.beta = Tools.ToRadians(50);
			camera.attachControl(canvas, true);
			return camera;
		};

		const createLight = async (scene: Scene): Promise<DirectionalLight> => {
			const light = new DirectionalLight('dir01', new Vector3(0.3, -1, 0), scene);
			light.position = new Vector3(0, 0, 0);
			light.intensity = 3;

			scene.environmentTexture = new HDRCubeTexture(
				'./babylon/HDR-environment.hdr',
				scene,
				150
			);
			scene.createDefaultEnvironment({
				groundSize: 50,
				skyboxSize: 50,
				environmentTexture: './babylon/HDR-environment.hdr'
			});

			return light;
		};

		const createModels = async (
			scene: Scene
		): Promise<(Mesh | AbstractMesh)[]> => {
			const modelsNames = ['css3.gltf', 'html5.gltf', 'react.gltf', 'logos.gltf'];
			const modelsArray = await loadModels(modelsNames, scene);

			const visibleModels: string[] = ['css3', 'html5', 'react', 'JAVASCRIPT_5'];
			visibleModels.forEach(model => {
				const mesh = scene.getNodeByName(model);
				if (mesh) {
					changeMeshVisibility(mesh, 1);
				}
			});
			return modelsArray;
		};

		const createShadows = async (
			light: DirectionalLight,
			models: (Mesh | AbstractMesh)[]
		): Promise<ShadowGenerator> => {
			const shadowGenerator = new ShadowGenerator(1024, light);
			shadowGenerator.useBlurExponentialShadowMap = true;
			shadowGenerator.blurKernel = 32;
			models.forEach(model => {
				shadowGenerator.addShadowCaster(model);
				model.receiveShadows = true;
			});
			light.autoCalcShadowZBounds = true;
			return shadowGenerator;
		};

		const createBabylonProject = async (canvas: HTMLCanvasElement) => {
			const engine = new Engine(canvas, true);
			let scene: Scene | null = null;
			let camera: ArcRotateCamera | null = null;
			let light: DirectionalLight | null = null;
			let models: (Mesh | AbstractMesh)[] | null = null;
			let shadows: ShadowGenerator | null = null;

			try {
				scene = await createScene(engine);
				camera = await createCamera(scene, canvas);
				light = await createLight(scene).catch(() => null);
				models = await createModels(scene).catch(() => null);
			} finally {
				if (light && models) {
					shadows = await createShadows(light, models).catch(() => null);
				}

				setBabylonProjectStates((prevState: babylonProjectStatesI) => ({
					...prevState,
					engine,
					scene: scene || prevState.scene,
					camera: camera || prevState.camera,
					light: light || prevState.light,
					models: models || prevState.models,
					shadows: shadows || prevState.shadows
				}));
				engine.runRenderLoop(() => {
					scene?.render();
				});

				window.addEventListener('resize', () => {
					engine.resize();
				});
			}
			return () => {
				engine.dispose();
			};
		};

		createBabylonProject(canvas);
	}, [setBabylonProjectStates]);

	return <canvas ref={canvasRef} className="avatar-container" />;
};

export default SkillsAvatar;
