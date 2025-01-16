import {
	AbstractMesh,
	ActionEvent,
	ActionManager,
	Animation,
	ArcRotateCamera,
	Color4,
	DirectionalLight,
	Engine,
	ExecuteCodeAction,
	HDRCubeTexture,
	Mesh,
	Node,
	Scene,
	SceneLoader,
	ShadowGenerator,
	Tools,
	Vector3
} from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { randomNumber } from './common';
import {
	babylonProjectStatesI,
	MeshTooltip
} from '../../components/SkillsContext';
import {
	loadingAnimationModelsNames,
	loadingModelProps,
	meshStartingPropsObject,
	startingLoadingModels,
	startingTooltips
} from '../../startingValues';

interface MeshMetadataI {
	mainParent?: Node | AbstractMesh | Mesh;
	mainParentName?: string;
}

interface SceneMetadataI {
	gui?: GUI.AdvancedDynamicTexture;
}

interface animationOptionsI {
	amplitude?: number;
	speed?: number;
	axis?: 'x' | 'y' | 'z';
	type?: 'position' | 'rotation';
}

export const changeMeshVisibility = (node: Node, visibility: number): void => {
	if (node instanceof AbstractMesh) {
		const isVisible = visibility === 0 ? false : true;
		node.visibility = visibility;
		node.isPickable = isVisible;
	}
	node.getChildren().forEach(child => {
		changeMeshVisibility(child, visibility);
	});
};

export const loadModels = async (
	startingModels: loadingModelProps[],
	scene: Scene
): Promise<AbstractMesh[]> => {
	const loadedModels = await Promise.all(
		startingModels.map(async startingModel => {
			try {
				const model = await SceneLoader.ImportMeshAsync(
					'',
					'./babylon/models/',
					startingModel.modelName,
					scene
				);
				const mainMesh = model.meshes[0];
				mainMesh.name = startingModel.modelName.slice(
					0,
					startingModel.modelName.indexOf('.')
				);
				mainMesh.rotation = new Vector3(0, 0, 0);

				await Promise.all(
					model.meshes.map(mesh => {
						const meshMetadata: MeshMetadataI = {
							mainParent: mainMesh,
							mainParentName: mainMesh.name
						};
						mesh.metadata = meshMetadata;
						mesh.material
							?.getActiveTextures()
							.map(texture => texture?.readPixels?.());
					})
				);

				if (startingModel.position) {
					mainMesh.position = startingModel.position;
				}
				if (startingModel.rotation) {
					mainMesh.rotation = startingModel.rotation;
				}
				if (startingModel.scaling) {
					mainMesh.scaling = startingModel.scaling;
				}

				return mainMesh;
			} catch (error) {
				console.error(
					`Ошибка при загрузке модели ${startingModel.modelName}:`,
					error
				);
				return null;
			}
		})
	);

	return loadedModels.filter((model): model is AbstractMesh => model !== null);
};

export const addCycleMeshAnimation = (
	mesh: Node,
	scene: Scene,
	options: animationOptionsI = {}
): void => {
	const amplitude = options.amplitude || 0.1;
	const speed = options.speed || 1;
	const type = options.type || 'position';
	const axis = options.axis || 'y';
	const startValue = mesh[type as keyof Node][axis];

	const animation = new Animation(
		`${mesh.name}_cycle_${type}_${axis}`,
		`${type}.${axis}`,
		60,
		Animation.ANIMATIONTYPE_FLOAT,
		Animation.ANIMATIONLOOPMODE_CYCLE
	);

	const keyFrames = [
		{ frame: 0, value: startValue },
		{ frame: 30, value: startValue + amplitude },
		{ frame: 60, value: startValue }
	];
	animation.setKeys(keyFrames);

	animation.framePerSecond = 60;

	mesh.animations.push(animation);
	scene.beginAnimation(mesh, 0, 60, true, 60 / (speed * 60));
};

export const meshLookAtCamera = (mesh: Node): void => {
	const scene = mesh.getScene();
	const camera = scene.activeCamera;
	if (camera) {
		const observer = camera.getScene().onBeforeRenderObservable.add(() => {
			(mesh as AbstractMesh).lookAt(camera.position);
		});

		scene.onDisposeObservable.add(() => {
			scene.onBeforeRenderObservable.remove(observer);
		});
	}
};

export function triggerMouseMeshLogic(type: string, e: ActionEvent) {
	if (type === 'OnPointerOverTrigger') {
		triggerOverMesh(e);
	}
	if (type === 'OnPointerOutTrigger') {
		triggerOutMesh(e);
	}

	function triggerOverMesh(e: ActionEvent) {
		const mainParentName = e.meshUnderPointer?.metadata.mainParentName || null;
		const scene = e.meshUnderPointer?.getScene();

		if (scene && mainParentName) {
			const tooltip = startingTooltips.find(
				tooltip => tooltip.linkModelName === mainParentName
			);
			if (tooltip) tooltip.methods?.revial?.();
		}
	}
	function triggerOutMesh(e: ActionEvent) {
		const mainParentName = e.meshUnderPointer?.metadata.mainParentName || null;
		const scene = e.meshUnderPointer?.getScene();

		if (scene && mainParentName) {
			const tooltip = startingTooltips.find(
				tooltip => tooltip.linkModelName === mainParentName
			);
			if (tooltip) tooltip.methods?.hide?.();
		}
	}
}

export async function createScene(
	engine: Engine,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const scene = new Scene(engine);
	scene.clearColor = new Color4(0, 0, 0, 0);
	scene.hoverCursor = 'pointer';
	const sceneMetadata: SceneMetadataI = {};
	scene.metadata = sceneMetadata;
	if (scene.isReady()) {
		scene.debugLayer.show({
			handleResize: false,
			overlay: true
		});
		setBabylonProjectStates(prevState => ({
			...prevState,
			scene: scene
		}));
		const camera = await createCamera(scene, engine.getRenderingCanvas()!);
		setBabylonProjectStates(prevState => ({
			...prevState,
			state: 'initialized',
			camera: camera
		}));
	}
}

export const createCamera = async (
	scene: Scene,
	canvas: HTMLCanvasElement
): Promise<ArcRotateCamera> => {
	const camera = new ArcRotateCamera(
		'camera',
		Math.PI / 2,
		Math.PI / 2,
		6,
		new Vector3(-1, 2.5, 0),
		scene
	);
	camera.alpha = Tools.ToRadians(180);
	camera.beta = Tools.ToRadians(80);
	camera.attachControl(canvas, true);
	return camera;
};

export function createLight(
	scene: Scene,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
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
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'loading',
		light: light
	}));
}

export async function createModels(
	scene: Scene,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const modelsArray = await loadModels(startingLoadingModels, scene);

	createMeshTooltips(modelsArray, scene);

	modelsArray.forEach(model => {
		if (model) {
			changeMeshVisibility(model, 0);
			addActionManagerToMesh(model, [
				'OnPointerOverTrigger',
				'OnPointerOutTrigger',
				'OnPickDownTrigger',
				'OnPickUpTrigger'
			]);
		}
	});

	loadingAnimationModelsNames.forEach(modelName => {
		const mesh = scene.getNodeByName(modelName);
		if (mesh) {
			const randomAmplitudePosition = randomNumber(-0.5, 0.5);
			const randomSpeedPosition = randomNumber(3, 5);
			addCycleMeshAnimation(mesh, scene, {
				amplitude: randomAmplitudePosition,
				speed: randomSpeedPosition,
				axis: 'y',
				type: 'position'
			});

			const randomAmplitudeRotation = randomNumber(-1, 1);
			const randomSpeedRotation = randomNumber(5, 10);
			addCycleMeshAnimation(mesh, scene, {
				amplitude: randomAmplitudeRotation,
				speed: randomSpeedRotation,
				axis: 'y',
				type: 'rotation'
			});
		}
	});

	const followCameraMeshes: string[] = ['react'];
	followCameraMeshes.forEach(modelName => {
		const mesh = scene.getNodeByName(modelName);
		if (mesh) {
			meshLookAtCamera(mesh);
		}
	});

	startingLoadingModels.forEach(model => {
		const mesh = scene.getNodeByName(
			model.modelName.slice(0, model.modelName.indexOf('.'))
		);

		if (mesh && typeof model.visibility === 'number') {
			changeMeshVisibility(mesh, model.visibility);
		}
	});

	for (const key in meshStartingPropsObject) {
		const mesh = scene.getNodeByName(key);

		if (mesh && typeof meshStartingPropsObject[key].visibility === 'number') {
			changeMeshVisibility(mesh, meshStartingPropsObject[key].visibility);
		}
	}

	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'loaded',
		models: modelsArray
	}));
}

function createMeshTooltips(modelsArray: AbstractMesh[], scene: Scene) {
	if (modelsArray.length > 0 && startingTooltips.length > 0) {
		const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
		scene.metadata.gui = advancedTexture;

		startingTooltips.map(tooltipObject => {
			const model = scene.getNodeByName(tooltipObject.positionMeshName);
			if (model) {
				createMeshTooltip(model as AbstractMesh, tooltipObject, advancedTexture);
			}
		});
	}
}

export function createShadows(
	light: DirectionalLight,
	models: (Mesh | AbstractMesh)[],
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const shadowGenerator = new ShadowGenerator(1024, light);
	shadowGenerator.useBlurExponentialShadowMap = true;
	shadowGenerator.blurKernel = 32;
	models.forEach(model => {
		shadowGenerator.addShadowCaster(model);
		model.receiveShadows = true;
	});
	light.autoCalcShadowZBounds = true;
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'ready',
		shadows: shadowGenerator
	}));
}

export function createEngine(
	canvas: HTMLCanvasElement,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const engine = new Engine(canvas, true, {
		adaptToDeviceRatio: true,
		antialias: true
	});
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'initializing',
		engine: engine
	}));
}

export function startRenderScene(
	babylonProjectStates: babylonProjectStatesI,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>
) {
	const engine = babylonProjectStates.engine;
	const scene = babylonProjectStates.scene;
	if (!engine || !scene) {
		return;
	}
	engine.runRenderLoop(() => {
		scene.render();
	});
	window.addEventListener('resize', () => {
		engine.resize();
	});
	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'running'
	}));
}
function addActionManagerToMesh(
	model: AbstractMesh,
	actionManagerTypes: string[]
) {
	const scene = model.getScene();
	if (!scene) {
		return;
	}

	const groupArray = [model].concat(model.getChildMeshes());
	groupArray.forEach(mesh => {
		mesh.actionManager = new ActionManager(scene);
		actionManagerTypes.forEach(type => {
			if (type in ActionManager) {
				const actionType = ActionManager[type as keyof typeof ActionManager];
				mesh.actionManager!.registerAction(
					new ExecuteCodeAction(actionType, e => {
						triggerMouseMeshLogic(type, e);
					})
				);
			} else {
				console.warn(`Неизвестный тип триггера: ${type}`);
			}
		});
	});
}

function createMeshTooltip(
	mesh: AbstractMesh,
	tooltipObject: MeshTooltip,
	advancedTexture: GUI.AdvancedDynamicTexture
) {
	const modelTooltip = new GUI.Container(
		tooltipObject.linkModelName + '_tooltip'
	);
	advancedTexture.addControl(modelTooltip);
	modelTooltip.linkWithMesh(mesh);
	modelTooltip.linkOffsetY = -150;
	const rootStyles = getComputedStyle(document.documentElement);
	const fontFamily = rootStyles.getPropertyValue('--font-family') || 'Arial';

	const bg = new GUI.Rectangle('rect');
	bg.height = '40px';
	bg.cornerRadius = 20;
	bg.thickness = 3;
	bg.color = rootStyles.getPropertyValue('--button-text') || 'Green';
	bg.background = rootStyles.getPropertyValue('--button-hover-bg') || 'Orange';
	bg.isPointerBlocker = false;
	modelTooltip.addControl(bg);

	const label = new GUI.TextBlock('tb', `${tooltipObject.text}`);
	bg.addControl(label);
	label.fontSize = 20;
	label.fontFamily = rootStyles.getPropertyValue('--text-font');

	const textWidth = getTextWidth(tooltipObject.text, `20px ${fontFamily}`);
	bg.width = textWidth + 30 + 'px';
	tooltipObject.gui = modelTooltip;
	tooltipObject.name = modelTooltip.name;
	tooltipObject.targetMesh = mesh;
	tooltipObject.methods = tooltipObject.methods || {};
	tooltipObject.methods.hide = () => {
		setVisibleCurrentGUI(tooltipObject.linkModelName, 0, mesh.getScene());
	};
	tooltipObject.methods.revial = () => {
		setVisibleCurrentGUI(tooltipObject.linkModelName, 1, mesh.getScene());
	};

	tooltipObject.methods.hide();
}

export function setVisibleCurrentGUI(
	meshName: string,
	visibility: number,
	scene: Scene
) {
	const gui = scene.metadata?.gui as GUI.AdvancedDynamicTexture;
	if (!gui) {
		console.error('GUI not found on the scene metadata.');
		return;
	}

	const tooltip = gui.getControlByName(meshName + '_tooltip') as GUI.Container;
	if (tooltip) {
		tooltip.isVisible = visibility > 0;
		const bg = tooltip.children[0] as GUI.Rectangle;
		if (!bg) {
			return;
		}
		const rootStyles = getComputedStyle(document.documentElement);
		bg.color = rootStyles.getPropertyValue('--button-text') || 'Green';
		bg.background = rootStyles.getPropertyValue('--button-hover-bg') || 'Orange';
	} else {
		console.error(`No tooltip found for mesh: ${meshName}`);
	}
}

function getTextWidth(text: string, font: string) {
	const element = document.createElement('canvas');
	const context = element.getContext('2d');

	if (!context) {
		return 0;
	}

	context.font = font;
	const width = context.measureText(text).width;
	element.remove();

	return Math.ceil(width);
}
