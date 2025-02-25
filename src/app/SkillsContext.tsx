/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import {
	AbstractMesh,
	ArcRotateCamera,
	DirectionalLight,
	DynamicTexture,
	Engine,
	Mesh,
	Node,
	Scene,
	ShadowGenerator,
	StandardMaterial,
	Tools,
	TransformNode,
	Vector3
} from 'babylonjs';
import React, {
	useEffect,
	createContext,
	useState,
	useContext,
	ReactNode,
	useMemo,
	useCallback
} from 'react';
import {
	FaHtml5,
	FaCss3Alt,
	FaJs,
	FaReact,
	FaGitAlt,
	FaLaptopCode,
	FaNetworkWired
} from 'react-icons/fa';
import {
	SiAdobeillustrator,
	SiCoreldraw,
	SiFigma,
	SiAsciidoctor,
	SiAdobephotoshop
} from 'react-icons/si';
import { MdBuild } from 'react-icons/md';
import * as GUI from 'babylonjs-gui';
import { changeMeshVisibility, ModelGroupsI } from '../features/models';
import { CameraPropsI, moveCamera } from '../features/camera';
import { drawnLines, drowedPoints } from '../entities/graphicsModel';
import { changeGitBtnClicks } from '../entities/treeModel';
import { changeTextureText } from '../entities/programmingBoard/ProgrammingBoard';

export interface loadingModelProps {
	modelName: string;
	linkName: string;
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
	cameraProps?: CameraPropsI;
	linkGroupName?: string;
}

export interface meshStartingProps {
	linkName: string;
	position?: Vector3;
	rotation?: Vector3;
	scaling?: Vector3;
	visibility?: number;
	cameraProps?: CameraPropsI;
	linkGroupName?: string;
	textureName?: string;
}

export interface babylonProjectStatesI {
	state:
		| 'idle' // Ничего не происходит
		| 'pending' // Ожидание старта
		| 'initializing' // Начало инициализации
		| 'initialized' // Сцена инициализирована
		| 'loading' // Загрузка ресурсов
		| 'loaded' // Ресурсы загружены
		| 'processed' // Ресурсы обрабатоны
		| 'ready' // Готово к рендерингу
		| 'running' // Активный рендеринг
		| 'paused' // Сцена приостановлена
		| 'error' // Ошибка
		| 'disposing' // Уничтожение сцены
		| 'disposed'; // Сцена уничтожена
	engine: Engine | null;
	scene: Scene | null;
	camera: ArcRotateCamera | null;
	light: DirectionalLight | null;
	models: (Mesh | AbstractMesh)[] | null;
	shadows: ShadowGenerator | null;
}

interface SkillsProviderProps {
	children: ReactNode;
}

export interface MeshTooltip {
	linkName: string;
	positionMeshName: string;
	linkTextProgramm?: string;
	text: string;
	name?: string;
	gui?: GUI.Container;
	targetMesh?: AbstractMesh;
	methods?: {
		hide?: () => void;
		revial?: () => void;
	};
}

export type LoadedNodesType = Record<
	string,
	{
		node: Node | AbstractMesh | Mesh | TransformNode;
	}
>;
export type GraphicsModelsT = Record<
	string,
	{
		position: Vector3;
		rotation: Vector3;
		boxSize: { width: number; height: number; depth: number };
	}
>;

export interface GitGraphValueI {
	message: string;
	parentId: string;
	position?: Vector3;
	mesh?: AbstractMesh;
	visibility?: number;
}

export type GitGraphValuesType = {
	[name: string]: GitGraphValueI;
};

interface SkillItemI {
	name: string;
	icon: ReactNode;
	level: number;
	linkName?: string;
}

interface HardSkillI {
	text: string;
	icon: ReactNode;
	items: SkillItemI[];
	skillLinkName?: string;
}

interface SkillsContextType {
	hardSkills: HardSkillI[];
	softSkills: string[];
	selectedSkill: string | null;
	setSelectedSkill: (skill: string) => void;
	babylonProjectStates: babylonProjectStatesI;
	setBabylonProjectStates: React.Dispatch<
		React.SetStateAction<babylonProjectStatesI>
	>;
	selectedProgramm: string | null;
	setSelectedProgramm: (programm: string) => void;
	loadingAnimationModelsNames: string[];
	meshStartingPropsObject: {
		[key: string]: meshStartingProps;
	};
	loadedNodes: LoadedNodesType;
	addNode: (
		key: string,
		value: {
			node: Node | AbstractMesh | Mesh | TransformNode;
		}
	) => void;
	removeNode: (key: string) => void;
	startingTooltips: MeshTooltip[];
	startingLoadingModels: loadingModelProps[];
	startingCameraProps: CameraPropsI;
	setCameraProps: (cameraProps: CameraPropsI | null) => void;
	modelGroups: ModelGroupsI;
	overedMesh: AbstractMesh | null;
	setOveredMesh: React.Dispatch<React.SetStateAction<AbstractMesh | null>>;
	graphicModelsNames: GraphicsModelsT;
	registerActionsModelsNames: string[];
	gitGraphValues: GitGraphValuesType;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
	const [selectedSkill, setSelectedSkillState] = useState<string>('0');
	const setSelectedSkill = useCallback((skill: string) => {
		setSelectedSkillState(skill);
	}, []);
	const [selectedProgramm, setSelectedProgrammState] = useState<string | null>(
		null
	);
	const setSelectedProgramm = useCallback((programm: string) => {
		setSelectedProgrammState(programm);
	}, []);
	const [babylonProjectStates, setBabylonProjectStates] =
		useState<babylonProjectStatesI>({
			state: 'idle',
			engine: null,
			scene: null,
			camera: null,
			light: null,
			models: null,
			shadows: null
		});
	const [startingCameraProps] = useState<CameraPropsI>({
		target: new Vector3(-1, 2.5, 0),
		alpha: Tools.ToRadians(180),
		beta: Tools.ToRadians(80),
		radius: 6
	});
	const [overedMesh, setOveredMesh] = useState<AbstractMesh | null>(null);
	const [cameraProps, setCameraPropsState] = useState<CameraPropsI | null>(null);
	const setCameraProps = useCallback((cameraProps: CameraPropsI | null) => {
		setCameraPropsState(cameraProps);
	}, []);

	const loadingAnimationModelsNames = useMemo<string[]>(
		() => ['css', 'html', 'logos', 'react', 'vscode', 'as3'],
		[]
	);

	const registerActionsModelsNames = useMemo<string[]>(
		() => ['css', 'html', 'logos', 'react', 'vscode', 'as3'],
		[]
	);

	const graphicModelsNames = useMemo<GraphicsModelsT>(
		() => ({
			vectorDesk: {
				model: null,
				position: new Vector3(0, 2.5, 0),
				rotation: new Vector3(0, 0, Tools.ToRadians(350)),
				boxSize: { width: 0.1, height: 3, depth: 4 }
			}
		}),
		[]
	);

	const gitGraphValues = useMemo<GitGraphValuesType>(
		() => ({
			commit1: {
				message: 'Initial commit',
				parentId: '',
				position: new Vector3(0, 0, 0)
			},
			commit2: { message: 'Add feature A', parentId: 'commit1' },
			commit3: { message: 'Fix bug in feature A', parentId: 'commit2' },
			commit4: {
				message: 'Add feature B',
				parentId: 'commit2',
				position: new Vector3(0.6, 0.5, 0)
			},
			commit5: {
				message: 'Fix bug in feature B',
				parentId: 'commit4',
				visibility: 0
			},
			commit6: {
				message: 'Merge feature B',
				parentId: 'commit3',
				position: new Vector3(0, 1.1, 0),
				visibility: 0
			},
			commit7: {
				message: '',
				parentId: 'commit5',
				position: new Vector3(-0.6, 0, 0),
				visibility: 0
			}
		}),
		[]
	);

	const meshStartingPropsObject = useMemo<{
		[key: string]: meshStartingProps;
	}>(
		() => ({
			JAVASCRIPT_5: {
				linkName: 'js',
				visibility: 1,
				cameraProps: {
					target: new Vector3(0.4, 3.5, -0.3),
					alpha: Tools.ToRadians(170),
					beta: Tools.ToRadians(85),
					radius: 6
				}
			}
		}),
		[]
	);

	const startingTooltips = useMemo<MeshTooltip[]>(
		() => [
			{
				linkName: 'css',
				linkTextProgramm: 'css',
				positionMeshName: 'Object_5',
				text: 'CSS3 Model Tooltip'
			},
			{
				linkName: 'react',
				linkTextProgramm: 'react',
				positionMeshName: 'react',
				text: 'React Model Tooltip'
			},
			{
				linkName: 'js',
				linkTextProgramm: 'javascript',
				positionMeshName: 'Object_22',
				text: 'JavaScript Model Tooltip'
			},
			{
				linkName: 'as3',
				linkTextProgramm: 'as3',
				positionMeshName: 'as3',
				text: 'as3 Model Tooltip'
			},
			{
				linkName: 'html',
				linkTextProgramm: 'html',
				positionMeshName: 'Plane.002_five_0',
				text: 'HTML5 Model Tooltip'
			},
			{
				linkName: 'vscode',
				linkTextProgramm: 'vscode',
				positionMeshName: 'vscode',
				text: 'VScode Model Tooltip'
			}
		],
		[]
	);

	const startingLoadingModels = useMemo<loadingModelProps[]>(
		() => [
			{
				modelName: 'css3.gltf',
				linkName: 'css',
				position: new Vector3(0, 0.6, -1.6),
				rotation: new Vector3(0, Tools.ToRadians(270), 0),
				scaling: new Vector3(-0.007, 0.007, 0.007),
				visibility: 1,
				cameraProps: {
					target: new Vector3(2, 1.7, -2),
					alpha: Tools.ToRadians(162),
					beta: Tools.ToRadians(85),
					radius: 5
				}
			},
			{
				modelName: 'react.gltf',
				linkName: 'react',
				position: new Vector3(0, 2.1, 0),
				rotation: new Vector3(0, Tools.ToRadians(270), 0),
				scaling: new Vector3(0.3, 0.3, 0.3),
				visibility: 1,
				cameraProps: {
					target: new Vector3(-1, 2.5, 0),
					alpha: Tools.ToRadians(180),
					beta: Tools.ToRadians(65),
					radius: 3
				}
			},
			{
				modelName: 'logos.gltf',
				linkName: 'logos',
				position: new Vector3(0, 4.1, -1.1),
				rotation: new Vector3(0, Tools.ToRadians(270), 0),
				scaling: new Vector3(0.7, 0.7, -0.7),
				visibility: 0,
				cameraProps: {
					target: new Vector3(0.4, 3.5, -0.3),
					alpha: Tools.ToRadians(170),
					beta: Tools.ToRadians(85),
					radius: 6
				}
			},
			{
				modelName: 'html5.gltf',
				linkName: 'html',
				position: new Vector3(0, 2, 1.6),
				rotation: new Vector3(0, Tools.ToRadians(180), 0),
				scaling: new Vector3(0.25, 0.25, -0.25),
				visibility: 1,
				cameraProps: {
					target: new Vector3(2, 2.5, 1.8),
					alpha: Tools.ToRadians(180),
					beta: Tools.ToRadians(85),
					radius: 6
				}
			},
			{
				modelName: 'vscode.gltf',
				linkName: 'vscode',
				position: new Vector3(0, 2, 0),
				rotation: new Vector3(0, Tools.ToRadians(90), 0),
				scaling: new Vector3(0.4, 0.4, 0.4),
				visibility: 1,
				cameraProps: {
					target: new Vector3(1.9, 1.7, 0),
					alpha: Tools.ToRadians(180),
					beta: Tools.ToRadians(85),
					radius: 5
				}
			},
			{
				modelName: 'as3.gltf',
				linkName: 'as3',
				position: new Vector3(0, 0.8, 1),
				rotation: new Vector3(0, Tools.ToRadians(90), 0),
				scaling: new Vector3(0.03, 0.03, 0.03),
				visibility: 1,
				cameraProps: {
					target: new Vector3(1.8, 1.1, 1),
					alpha: Tools.ToRadians(180),
					beta: Tools.ToRadians(85),
					radius: 6
				}
			},
			{
				modelName: 'robot.gltf',
				linkName: 'robot',
				position: new Vector3(0, 0.5, 0),
				rotation: new Vector3(0, Tools.ToRadians(240), 0),
				scaling: new Vector3(2, 2, 2),
				visibility: 1,
				cameraProps: {
					target: new Vector3(0, 1, 1),
					alpha: Tools.ToRadians(180),
					beta: Tools.ToRadians(85),
					radius: 6
				}
			},
			{
				modelName: 'buttons.gltf',
				linkName: 'gitButtons',
				position: new Vector3(1.4, 1, 0),
				rotation: new Vector3(0, Tools.ToRadians(270), 0),
				scaling: new Vector3(0.3, 0.3, -0.3),
				visibility: 1
			},
			{
				modelName: 'computer.gltf',
				linkName: 'computer',
				position: new Vector3(-0.1, 2.5, -0.3),
				rotation: new Vector3(0, Tools.ToRadians(65), 0),
				scaling: new Vector3(4, 4, -4),
				visibility: 1,
				cameraProps: {
					target: new Vector3(-0.2, 2.7, 0),
					alpha: Tools.ToRadians(205),
					beta: Tools.ToRadians(90),
					radius: 4
				}
			}
		],
		[]
	);

	const modelGroups = useMemo<ModelGroupsI>(
		() => ({
			programming: {
				linkNames: ['css', 'html', 'react', 'js', 'logos', 'as3'],
				models: []
			},
			versionControl: { linkNames: ['commitModel'], models: [] },
			programmingTools: {
				linkNames: ['computer'],
				models: []
			},
			graphicTools: {
				linkNames: ['vectorDesk'],
				models: []
			},
			neuro: { linkNames: ['robot'], models: [] }
		}),
		[]
	);

	const hardSkills = useMemo<HardSkillI[]>(
		() => [
			{
				text: 'Фронтенд разработка',
				icon: <MdBuild />,
				items: [
					{ name: 'HTML', icon: <FaHtml5 />, level: 70, linkName: 'html' },
					{ name: 'CSS', icon: <FaCss3Alt />, level: 75, linkName: 'css' },
					{ name: 'JavaScript', icon: <FaJs />, level: 95, linkName: 'js' },
					{ name: 'React', icon: <FaReact />, level: 60, linkName: 'react' },
					{ name: 'AS3', icon: <SiAsciidoctor />, level: 95, linkName: 'as3' }
				],
				skillLinkName: 'programming'
			},
			{
				text: 'Контроль версий',
				icon: <MdBuild />,
				items: [
					{ name: 'Git', icon: <FaGitAlt />, level: 70, linkName: 'commitModel' }
				],
				skillLinkName: 'versionControl'
			},
			{
				text: 'Инструменты разработки',
				icon: <MdBuild />,
				items: [
					{
						name: 'Visual Studio Code',
						icon: <FaLaptopCode />,
						level: 95,
						linkName: 'computer'
					},
					{ name: 'Sublime Text', icon: <FaLaptopCode />, level: 95 }
				],
				skillLinkName: 'programmingTools'
			},
			{
				text: 'Графический дизайн',
				icon: <MdBuild />,
				items: [
					{ name: 'Corel Draw', icon: <SiCoreldraw />, level: 80 },
					{ name: 'Photoshop', icon: <SiAdobephotoshop />, level: 60 },
					{ name: 'Illustrator', icon: <SiAdobeillustrator />, level: 60 },
					{ name: 'Figma', icon: <SiFigma />, level: 30 }
				],
				skillLinkName: 'graphicTools'
			},
			{
				text: 'Нейросети',
				icon: <MdBuild />,
				items: [
					{
						name: 'Активный пользователь различных ИИ для генерации текста, рисунков',
						icon: <FaNetworkWired />,
						level: 70,
						linkName: 'robot'
					}
				],
				skillLinkName: 'neuro'
			}
		],
		[]
	);

	const softSkills = useMemo<string[]>(
		() => [
			'🗣️ Отличные навыки связи и командной работы',
			'⏳ Умение работать в условиях жестких сроков и высокого давления',
			'🎯 Самостоятельность, целеустремленность и ответственность',
			'📚 Высокий уровень обучаемости, адаптации к новым технологиям и инструментам'
		],
		[]
	);

	const allHardSkillItems = useMemo(
		() => hardSkills.flatMap(skill => skill.items),
		[hardSkills]
	);
	const [loadedNodes, setLoadedNodes] = useState<LoadedNodesType>({});

	const addNode = useCallback(
		(
			key: string,
			value: { node: Node | AbstractMesh | Mesh | TransformNode }
		) => {
			setLoadedNodes(prev => {
				if (prev[key]) {
					const unicName = `egor_mesh_${Object.keys(prev).length}`;
					value.node.name = unicName;
					return { ...prev, [unicName]: value };
				}
				return { ...prev, [key]: value };
			});
		},
		[]
	);

	const removeNode = useCallback((key: string) => {
		setLoadedNodes(prev => {
			if (!(key in prev)) return prev;

			const updatedNodes = { ...prev };
			delete updatedNodes[key];

			return updatedNodes;
		});
	}, []);

	useEffect(() => {
		if (cameraProps && babylonProjectStates.camera) {
			moveCamera(babylonProjectStates.camera, cameraProps.target, {
				alpha: cameraProps.alpha,
				beta: cameraProps.beta,
				radius: cameraProps.radius
			});
		}
	}, [cameraProps]);

	useEffect(() => {
		if (selectedSkill && babylonProjectStates.state === 'running') {
			const rootStyles = getComputedStyle(document.documentElement);
			const bgColor =
				rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';
			const modelGroup =
				modelGroups[hardSkills[Number(selectedSkill)].skillLinkName || 'common'];
			if (modelGroup) {
				const scene = babylonProjectStates.scene;
				if (!scene) {
					return;
				}

				startingLoadingModels.forEach(modelObject => {
					const mesh = loadedNodes[modelObject.linkName]?.node;
					if (!mesh) {
						return;
					}
					if (modelObject.visibility) {
						changeMeshVisibility(
							mesh,
							modelGroup.linkNames.includes(modelObject.linkName)
								? modelObject.visibility
								: 0,
							true,
							300,
							!modelGroup.linkNames.includes(modelObject.linkName)
						);
					}
				});
				Object.entries(meshStartingPropsObject).forEach(([, value]) => {
					const mesh = loadedNodes[value.linkName]?.node;
					if (!mesh) {
						return;
					}

					if (value.visibility) {
						changeMeshVisibility(
							mesh,
							modelGroup.linkNames.includes(value.linkName) ? value.visibility : 0,
							true,
							300,
							!modelGroup.linkNames.includes(value.linkName)
						);
					}
				});
				Object.entries(graphicModelsNames).forEach(([name]) => {
					const mesh: AbstractMesh = loadedNodes[name]?.node as AbstractMesh;
					if (!mesh) {
						return;
					}
					changeMeshVisibility(
						mesh,
						modelGroup.linkNames.includes(name) ? 1 : 0,
						true,
						300,
						!modelGroup.linkNames.includes(name)
					);
					const dynamicTexture = (mesh.material as StandardMaterial)
						?.diffuseTexture as DynamicTexture;
					const context = dynamicTexture?.getContext();

					if (!context) {
						return;
					}
					context.fillStyle = bgColor;
					context.fillRect(0, 0, 1024, 1024);
					dynamicTexture.update();
					drowedPoints.clear();
					drawnLines.clear();
				});

				const mesh: AbstractMesh = loadedNodes['commitModel']?.node as AbstractMesh;
				if (!mesh) {
					return;
				}
				changeMeshVisibility(
					mesh,
					modelGroup.linkNames.includes('commitModel') ? 1 : 0,
					true,
					300,
					!modelGroup.linkNames.includes('commitModel')
				);
				changeGitBtnClicks('Cylinder', true, scene);
			}

			if (babylonProjectStates.camera && startingCameraProps) {
				setCameraProps({
					target: startingCameraProps.target,
					alpha: startingCameraProps.alpha,
					beta: startingCameraProps.beta,
					radius: startingCameraProps.radius
				});
			}

			const skillContainer: HTMLDivElement = document.querySelector(
				'.skill-group-container'
			) as HTMLDivElement;
			if (skillContainer) {
				skillContainer.style.backgroundColor = '';
			}
			changeTextureText(bgColor);

			setSelectedSkill('');
		}
	}, [selectedSkill, babylonProjectStates]);

	useEffect(() => {
		if (selectedProgramm) {
			const meshName = allHardSkillItems.find(
				item => item.name === selectedProgramm
			)?.linkName;

			if (!meshName) {
				return;
			}
			const scene = babylonProjectStates.scene;
			if (!scene) {
				return;
			}
			const mesh = loadedNodes[meshName]?.node;
			if (!mesh) {
				return;
			}
			let cameraProps: CameraPropsI | null = null;
			startingLoadingModels.forEach(modelObject => {
				const mesh = loadedNodes[modelObject.linkName]?.node;
				if (!mesh) {
					return;
				}
				if (modelObject.visibility !== undefined) {
					changeMeshVisibility(
						mesh,
						mesh.name === meshName ? 1 : 0,
						true,
						300,
						!(mesh.name === meshName)
					);
				}
				if (
					mesh.name === meshName &&
					modelObject.cameraProps &&
					babylonProjectStates.camera
				) {
					cameraProps = modelObject.cameraProps;
				}
			});
			Object.entries(meshStartingPropsObject).forEach(([, value]) => {
				const mesh = loadedNodes[value.linkName]?.node;
				if (!mesh) {
					return;
				}

				if (value.visibility !== undefined) {
					changeMeshVisibility(
						mesh,
						mesh.name === meshName ? 1 : 0,
						true,
						300,
						!(mesh.name === meshName)
					);
				}

				if (
					mesh.name === meshName &&
					value.cameraProps &&
					babylonProjectStates.camera
				) {
					cameraProps = value.cameraProps;
				}
			});

			const rootStyles = getComputedStyle(document.documentElement);
			const bgColor =
				rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';

			Object.entries(graphicModelsNames).forEach(([name]) => {
				const mesh: AbstractMesh = loadedNodes[name]?.node as AbstractMesh;
				if (!mesh) {
					return;
				}
				changeMeshVisibility(
					mesh,
					meshName === mesh.name ? 1 : 0,
					true,
					300,
					!(meshName === mesh.name)
				);
				const dynamicTexture = (mesh.material as StandardMaterial)
					?.diffuseTexture as DynamicTexture;
				const context = dynamicTexture?.getContext();

				if (!context) {
					return;
				}
				context.fillStyle = bgColor;
				context.fillRect(0, 0, 1024, 1024);
				dynamicTexture.update();
				drowedPoints.clear();
				drawnLines.clear();
			});

			const commitModel: AbstractMesh = loadedNodes['commitModel']
				?.node as AbstractMesh;
			if (!commitModel) {
				return;
			}
			changeMeshVisibility(
				commitModel,
				commitModel.name === meshName ? 1 : 0,
				true,
				300,
				!(commitModel.name === meshName)
			);

			changeGitBtnClicks('Cylinder', true, scene);

			if (cameraProps === null) {
				cameraProps = startingCameraProps;
			}
			setCameraProps({
				target: cameraProps.target,
				alpha: cameraProps.alpha,
				beta: cameraProps.beta,
				radius: cameraProps.radius
			});

			const skillContainer: HTMLDivElement = document.querySelector(
				'.skill-group-container'
			) as HTMLDivElement;
			if (skillContainer) {
				skillContainer.style.backgroundColor = '';
			}
			changeTextureText(bgColor);

			setSelectedProgramm('');
		}
	}, [selectedProgramm]);

	const value = useMemo(
		() => ({
			hardSkills,
			softSkills,
			selectedSkill,
			setSelectedSkill,
			babylonProjectStates,
			setBabylonProjectStates,
			selectedProgramm,
			setSelectedProgramm,
			loadingAnimationModelsNames,
			meshStartingPropsObject,
			loadedNodes,
			addNode,
			removeNode,
			startingTooltips,
			startingLoadingModels,
			startingCameraProps,
			setCameraProps,
			modelGroups,
			overedMesh,
			setOveredMesh,
			graphicModelsNames,
			registerActionsModelsNames,
			gitGraphValues
		}),
		[
			selectedSkill,
			setSelectedSkill,
			selectedProgramm,
			setSelectedProgramm,
			babylonProjectStates,
			setBabylonProjectStates,
			setCameraProps,
			loadedNodes,
			overedMesh
		]
	);

	return (
		<SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>
	);
};

export const useSkillsContext = (): SkillsContextType => {
	const context = useContext(SkillsContext);
	if (!context) {
		throw new Error('useSkillsContext must be used within a SkillsProvider');
	}
	return context;
};
