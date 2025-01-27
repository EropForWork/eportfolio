import {
	AbstractMesh,
	ActionManager,
	Animatable,
	Animation,
	AnimationGroup,
	Color3,
	Color4,
	DirectionalLight,
	EasingFunction,
	Engine,
	ExecuteCodeAction,
	HDRCubeTexture,
	Mesh,
	Node,
	QuadraticEase,
	Scene,
	SceneLoader,
	ShadowGenerator,
	TransformNode,
	Vector3
} from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { animateValue, randomNumber } from './common';
import {
	babylonProjectStatesI,
	GraphicsModelsT,
	LoadedNodesType,
	loadingModelProps,
	meshStartingProps,
	MeshTooltip
} from '../../components/SkillsContext';
import { CameraPropsI, createCamera } from './camera';
import { createGraphicModels } from './graphicsModel';

export interface MeshMetadataI {
	visibility: number;
	mainParent?: Node | AbstractMesh | Mesh;
	mainParentName?: string;
	cycleAnimation?: Animatable;
	realVisibility?: number;
	linkName?: string;
	linkGroupName?: string;
	currentTheme?: string;
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

export interface ModelGroupsI {
	[groupName: string]: {
		linkNames: string[];
		models: AbstractMesh[] | Mesh[] | Node[] | TransformNode[];
	};
}

export const changeMeshVisibility = (
	node: Node,
	propVisibility: number,
	saveVisibility: boolean = true,
	duration: number = 300
): void => {
	const visibility = node.name.includes('redSphere_')
		? propVisibility === 1
			? 0.1
			: propVisibility
		: propVisibility;

	(node.metadata as MeshMetadataI) = {
		...node.metadata,
		realVisibility: saveVisibility ? undefined : node.metadata.visibility,
		visibility: visibility
	};
	if (node instanceof AbstractMesh || node instanceof Mesh) {
		if (duration === 0) {
			node.visibility = visibility;
			node.isPickable = visibility !== 0;
		} else {
			const easingFunction = new QuadraticEase();
			easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

			const animationGroup = new AnimationGroup('meshVisibilityAnimationGroup');
			const visibilityAnimation = new Animation(
				'visibilityAnimation',
				'visibility',
				60,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT
			);

			const keyFrames = [
				{ frame: 0, value: node.visibility },
				{ frame: (duration / 1000) * 60, value: visibility }
			];
			visibilityAnimation.setKeys(keyFrames);
			visibilityAnimation.setEasingFunction(easingFunction);

			animationGroup.addTargetedAnimation(visibilityAnimation, node);

			node.isPickable = visibility !== 0;
			animationGroup.onAnimationGroupEndObservable.add(() => {
				animationGroup.dispose();
			});

			animationGroup.start();
		}
	}

	node.getChildren().forEach(child => {
		changeMeshVisibility(child, visibility, saveVisibility, duration);
	});
};

export const loadModels = async (
	startingModels: loadingModelProps[],
	scene: Scene,
	modelGroups: ModelGroupsI
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
				mainMesh.name = startingModel.linkName;
				mainMesh.rotation = new Vector3(0, 0, 0);

				model.meshes.forEach(mesh => {
					const meshMetadata: MeshMetadataI = {
						visibility: startingModel.visibility ? startingModel.visibility : 1,
						mainParent: mainMesh,
						mainParentName: mainMesh.name.toLocaleLowerCase(),
						linkName: startingModel.linkName,
						linkGroupName:
							Object.entries(modelGroups).find(([, group]) =>
								group.linkNames.includes(startingModel.linkName)
							)?.[0] || 'common'
					};
					mesh.metadata = meshMetadata;
					mesh.material
						?.getActiveTextures()
						?.forEach(texture => texture?.readPixels?.());
					mesh.overlayAlpha = 0;
				});

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

export function triggerMouseMeshLogic(
	type: string,
	mesh: AbstractMesh,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>
) {
	const scene = mesh?.getScene();
	if (!mesh || !scene) {
		return;
	}
	if (type === 'OnPointerOverTrigger') {
		revialTooltip(scene, mesh.metadata.linkName, startingTooltips, loadedNodes);
		const rootStyles = getComputedStyle(document.documentElement);
		const color3 =
			hexToColor3(rootStyles.getPropertyValue('--button-hover-bg')) ||
			new Color3(255, 0, 0);
		changeMeshOverlayAlpha(mesh, 0.9, 0.3, color3);
		if (mesh.metadata.mainParentName) {
			stopCycleAnimation(scene, mesh.metadata.mainParentName, loadedNodes);
		}
		setOveredMesh(mesh);
	}
	if (type === 'OnPointerOutTrigger') {
		hideTooltip(scene, mesh.metadata.linkName, startingTooltips, loadedNodes);
		const rootStyles = getComputedStyle(document.documentElement);
		const color3 =
			hexToColor3(rootStyles.getPropertyValue('--button-hover-bg')) ||
			new Color3(255, 0, 0);
		changeMeshOverlayAlpha(mesh, 0, 0.3, color3);
		if (mesh.metadata.mainParentName) {
			resumeCycleAnimation(mesh.metadata.mainParentName, loadedNodes);
		}
		setOveredMesh(null);
	}
	if (type === 'OnPickUpTrigger') {
		bounceModelAnimation(mesh);
	}

	function changeMeshOverlayAlpha(
		mesh: AbstractMesh,
		to: number | 1,
		duration: number | 1,
		color?: Color3
	) {
		mesh.renderOverlay = true;
		mesh.overlayColor = color || new Color3(255, 0, 0);
		const animationFn = animateValue(mesh.overlayAlpha, to, duration * 1000);
		const startTime = performance.now();

		const updateOverlay = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - startTime;
			mesh.overlayAlpha = animationFn(elapsed);

			if (elapsed < duration * 1000) {
				requestAnimationFrame(updateOverlay);
			} else {
				mesh.overlayAlpha = to;
			}
		};

		updateOverlay();
	}

	function bounceModelAnimation(mesh: AbstractMesh) {
		const animation = new Animation(
			'scaleAnimation',
			'scaling',
			30,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		animation.setKeys([
			{ frame: 0, value: mesh.scaling },
			{ frame: 30, value: mesh.scaling.scale(0.9) },
			{ frame: 60, value: mesh.scaling }
		]);

		const easing = new BABYLON.QuadraticEase();
		easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

		animation.setEasingFunction(easing);

		mesh.animations.push(animation);
		mesh.getScene().beginAnimation(mesh, 0, 60, false, 20);
	}
}

export async function createScene(
	engine: Engine,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	startingCameraProps: CameraPropsI
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
		const camera = await createCamera(
			scene,
			engine.getRenderingCanvas()!,
			startingCameraProps
		);
		setBabylonProjectStates(prevState => ({
			...prevState,
			state: 'initialized',
			camera: camera
		}));
	}
}

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

export async function loadUserModels(
	startingLoadingModels: loadingModelProps[],
	scene: Scene,
	modelGroups: ModelGroupsI,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	graphicModelsNames: GraphicsModelsT
) {
	const modelsArray = await loadModels(
		startingLoadingModels,
		scene,
		modelGroups
	);

	const graphicModels = await createGraphicModels(
		graphicModelsNames,
		scene,
		modelGroups
	);

	const modifiedModelsArray = modelsArray.concat(graphicModels);

	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'loaded',
		models: modifiedModelsArray
	}));
}

export async function processingUserModels(
	scene: Scene,
	loadedNodes: LoadedNodesType,
	modelsArray: (Mesh | AbstractMesh)[],
	startingTooltips: MeshTooltip[],
	loadingAnimationModelsNames: string[],
	meshStartingPropsObject: {
		[key: string]: meshStartingProps;
	},
	addNode: (
		key: string,
		value: {
			node: Node | AbstractMesh | Mesh | TransformNode;
		}
	) => void,
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>,
	registerActionsModelsNames: string[]
) {
	createMeshTooltips(modelsArray, scene, startingTooltips, loadedNodes);

	registerActionsModelsNames.forEach(modelName => {
		const mesh = loadedNodes[modelName]?.node;
		if (mesh) {
			addActionManagerToMesh(
				mesh as AbstractMesh,
				[
					'OnPointerOverTrigger',
					'OnPointerOutTrigger',
					'OnPickDownTrigger',
					'OnPickUpTrigger'
				],
				startingTooltips,
				loadedNodes,
				setOveredMesh
			);
		}
	});

	modelsArray.forEach(model => {
		changeMeshVisibility(model, 0, true, 0);
	});

	loadingAnimationModelsNames.forEach(modelName => {
		const mesh = loadedNodes[modelName]?.node;
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
		const mesh = loadedNodes[modelName]?.node;
		if (mesh) {
			meshLookAtCamera(mesh);
		}
	});

	for (const key in meshStartingPropsObject) {
		const mesh = loadedNodes[key]?.node;
		if (!mesh) {
			return;
		}
		(mesh.metadata as MeshMetadataI) = {
			...mesh.metadata,
			visibility: meshStartingPropsObject[key].visibility
				? meshStartingPropsObject[key].visibility
				: 1,
			linkName: meshStartingPropsObject[key].linkName
		};
		mesh.name = meshStartingPropsObject[key].linkName;
		addNode(mesh.name, { node: mesh });

		mesh.getChildMeshes().forEach(
			mesh =>
				((mesh.metadata as MeshMetadataI) = {
					...mesh.metadata,
					visibility: meshStartingPropsObject[key].visibility
						? meshStartingPropsObject[key].visibility
						: 1,
					linkName: meshStartingPropsObject[key].linkName
				})
		);
	}

	setBabylonProjectStates(prevState => ({
		...prevState,
		state: 'processed',
		models: modelsArray
	}));
}

function createMeshTooltips(
	modelsArray: AbstractMesh[],
	scene: Scene,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (modelsArray.length > 0 && startingTooltips.length > 0) {
		const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
		scene.metadata.gui = advancedTexture;

		startingTooltips.map(tooltipObject => {
			const model = loadedNodes[tooltipObject.positionMeshName]?.node;
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
	actionManagerTypes: string[],
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType,
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>
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
						if (e.meshUnderPointer) {
							triggerMouseMeshLogic(
								type,
								e.meshUnderPointer,
								startingTooltips,
								loadedNodes,
								setOveredMesh
							);
						}
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
	const scene = mesh.getScene();
	const camera = scene.activeCamera;
	const modelTooltip = new GUI.Container(tooltipObject.linkName + '_tooltip');
	advancedTexture.addControl(modelTooltip);
	modelTooltip.linkWithMesh(mesh);

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
		setVisibleCurrentGUI(tooltipObject.linkName, 0, mesh.getScene(), 200);
	};
	tooltipObject.methods.revial = () => {
		setVisibleCurrentGUI(tooltipObject.linkName, 1, mesh.getScene(), 200);
	};

	setVisibleCurrentGUI(tooltipObject.linkName, 0, mesh.getScene(), 0);

	const constantDistance = 1;

	scene.onBeforeRenderObservable.add(() => {
		if (camera && mesh) {
			const distance = Vector3.Distance(camera.position, mesh.position);
			const pixelOffset =
				(constantDistance / distance) * scene.getEngine().getRenderHeight();

			modelTooltip.linkOffsetY = -pixelOffset;
		}
	});
}

export function setVisibleCurrentGUI(
	meshName: string,
	visibility: number,
	scene: Scene,
	duration: number = 300
) {
	const gui = scene.metadata?.gui as GUI.AdvancedDynamicTexture;
	if (!gui) {
		console.error('GUI not found on the scene metadata.');
		return;
	}

	const tooltip = gui.getControlByName(meshName + '_tooltip') as GUI.Container;
	if (tooltip) {
		tooltip.alpha = tooltip.alpha || 0;

		const animationFn = animateValue(tooltip.alpha, visibility, duration);
		const startTime = performance.now();

		const updateOverlay = () => {
			const currentTime = performance.now();
			const elapsed = currentTime - startTime;
			tooltip.alpha = animationFn(elapsed);

			if (elapsed < duration) {
				requestAnimationFrame(updateOverlay);
			} else {
				tooltip.alpha = visibility;
			}
		};

		updateOverlay();

		const bg = tooltip.children[0] as GUI.Rectangle;
		if (bg) {
			const rootStyles = getComputedStyle(document.documentElement);
			bg.color = rootStyles.getPropertyValue('--button-text') || 'Green';
			bg.background = rootStyles.getPropertyValue('--button-hover-bg') || 'Orange';
		}
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

function stopCycleAnimation(
	scene: Scene,
	meshName: string,
	loadedNodes: LoadedNodesType
) {
	const mesh = loadedNodes[meshName]?.node;
	if (mesh && mesh.animations) {
		const activeAnimation = scene._activeAnimatables.find(anim =>
			anim._runtimeAnimations.some(
				runtimeAnim => runtimeAnim.animation === mesh.animations[0]
			)
		);

		if (activeAnimation) {
			mesh.metadata = {
				...mesh.metadata,
				cycleAnimation: activeAnimation
			};
			activeAnimation.pause();
		}
	}
}
function resumeCycleAnimation(meshName: string, loadedNodes: LoadedNodesType) {
	const mesh = loadedNodes[meshName]?.node;
	if (mesh && mesh.animations) {
		const { cycleAnimation } = mesh.metadata || {};
		if (cycleAnimation !== undefined) {
			(cycleAnimation as Animatable).restart();
		}
	}
}

function hexToColor3(hex: string): Color3 {
	const hexValue = hex.replace('#', '');
	const r = parseInt(hexValue.substring(0, 2), 16) / 255;
	const g = parseInt(hexValue.substring(2, 4), 16) / 255;
	const b = parseInt(hexValue.substring(4, 6), 16) / 255;
	return new Color3(r, g, b);
}

export function revialTooltip(
	scene: Scene,
	linkName: string,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (scene && linkName) {
		const tooltip = startingTooltips.find(
			tooltip => tooltip.linkName === linkName
		);
		if (tooltip) {
			tooltip.methods?.revial?.();

			const model = loadedNodes[tooltip.linkName]?.node;
			if (!model) {
				return;
			}
			const visibility: number =
				(model as AbstractMesh).visibility ??
				(model.metadata as MeshMetadataI).visibility ??
				1;

			if (visibility < 0.3) {
				changeMeshVisibility(model, 0.3, false);
			}
		}
	}
}
export function hideTooltip(
	scene: Scene,
	linkName: string,
	startingTooltips: MeshTooltip[],
	loadedNodes: LoadedNodesType
) {
	if (scene && linkName) {
		const tooltip = startingTooltips.find(
			tooltip => tooltip.linkName === linkName
		);
		if (tooltip) {
			tooltip.methods?.hide?.();
			const model = loadedNodes[tooltip.linkName]?.node;

			if (model && model.metadata.realVisibility !== undefined) {
				changeMeshVisibility(model, model.metadata.realVisibility);
			}
		}
	}
}

export const toColor3 = (colorString: string): Color3 => {
	if (colorString.startsWith('#')) {
		const hex = colorString.slice(1);
		if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			return new Color3(r / 255, g / 255, b / 255);
		} else if (hex.length === 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return new Color3(r / 255, g / 255, b / 255);
		} else {
			throw new Error(`Invalid HEX color string: "${colorString}"`);
		}
	} else if (colorString.startsWith('rgb')) {
		const match = colorString.match(
			/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d*\.?\d+)?\)/
		);
		if (!match) {
			throw new Error(`Invalid RGBA or RGB string: "${colorString}"`);
		}

		const [, r, g, b] = match.map(Number);
		return new Color3(r / 255, g / 255, b / 255);
	} else {
		throw new Error(`Проверьте цвет: "${colorString}"`);
	}
};
