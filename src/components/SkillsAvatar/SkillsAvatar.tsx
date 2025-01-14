import React, { useEffect, useRef } from 'react';
import { babylonProjectStatesI, useSkillsContext } from '../SkillsContext';
import 'babylonjs-loaders';
import './SkillsAvatar.css';
import {
	AbstractMesh,
	ArcRotateCamera,
	Color3,
	Color4,
	DirectionalLight,
	Engine,
	Mesh,
	MeshBuilder,
	Scene,
	SceneLoader,
	ShadowGenerator,
	StandardMaterial,
	Tools,
	Vector3
} from 'babylonjs';
import { changeMeshVisibility } from '../../functions/babylon/models';

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
			return light;
		};

		const createModels = async (
			scene: Scene
		): Promise<(Mesh | AbstractMesh)[]> => {
			const modelsNames = ['css3.gltf', 'html5.gltf', 'react.gltf', 'logos.gltf'];

			const loadModels = async (): Promise<AbstractMesh[]> => {
				const loadedModels = await Promise.all(
					modelsNames.map(async modelName => {
						try {
							const model = await SceneLoader.ImportMeshAsync(
								'',
								'./babylon/models/',
								modelName,
								scene
							);
							const mainMesh = model.meshes[0];
							changeMeshVisibility(mainMesh, 0);
							if (modelName === 'css3.gltf') {
								mainMesh.position = new Vector3(0.5, -2.5, 0.27);
								mainMesh.scaling = new Vector3(0.027, 0.027, 0.027);
								mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
							} else if (modelName === 'react.gltf') {
								mainMesh.position = new Vector3(-0.3, 2.5, 0);
								mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
							} else if (modelName === 'logos.gltf') {
								mainMesh.position = new Vector3(0, 2.5, 0);
								mainMesh.rotation = new Vector3(0, Tools.ToRadians(270), 0);
							} else if (modelName === 'html5.gltf') {
								changeMeshVisibility(mainMesh, 1);
							}
							return mainMesh;
						} catch (error) {
							console.error(`Ошибка при загрузке модели ${modelName}:`, error);
							return null;
						}
					})
				);

				return loadedModels.filter(
					(model): model is AbstractMesh => model !== null
				);
			};

			const modelsArray = await loadModels();

			const ground = MeshBuilder.CreateGround(
				'ground',
				{ width: 6, height: 6 },
				scene
			);
			ground.position.x = 0;

			const groundMaterial = new StandardMaterial('groundMaterial', scene);
			groundMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5);
			ground.material = groundMaterial;

			modelsArray.push(ground);

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
