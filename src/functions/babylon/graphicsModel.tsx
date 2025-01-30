import {
	AbstractMesh,
	Scene,
	Vector3,
	MeshBuilder,
	StandardMaterial,
	Mesh,
	Color3,
	ActionManager,
	ExecuteCodeAction,
	DynamicTexture
} from 'babylonjs';
import {
	addMeshMetadata,
	changeMeshVisibility,
	ModelGroupsI,
	toColor3
} from './models';
import {
	GraphicsModelsT,
	LoadedNodesType
} from '../../components/SkillsContext';

interface drowedPointI {
	x: number;
	y: number;
}

interface drowedPointsI {
	[key: string]: drowedPointI;
}

export const drowedPoints = new Map<string, drowedPointI>();
export const drawnLines = new Set<string>();

export const createGraphicModels = async (
	graphicModelsNames: GraphicsModelsT,
	scene: Scene,
	modelGroups: ModelGroupsI
): Promise<AbstractMesh[]> => {
	const createGraphicModel = async (
		name: string,
		position: Vector3,
		rotation: Vector3,
		scene: Scene,
		boxSize: { width: number; height: number; depth: number }
	): Promise<AbstractMesh> => {
		const mesh = MeshBuilder.CreateBox(name, boxSize, scene);
		mesh.position = position;
		mesh.rotation = rotation;
		addMeshMetadata(mesh, modelGroups, 1, mesh, name.toLocaleLowerCase(), name);

		const rootStyles = getComputedStyle(document.documentElement);
		const bgColor =
			rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';

		const textureSize: number = 1024;
		const texture = new DynamicTexture(
			'dynamicTexture',
			textureSize,
			scene,
			false
		);
		texture.hasAlpha = true;

		const context = texture.getContext();

		context.fillStyle = bgColor;
		context.fillRect(0, 0, textureSize, textureSize);
		texture.update();

		const material = new StandardMaterial('paintableMaterial', scene);
		material.diffuseTexture = texture;
		material.specularColor = new Color3(0, 0, 0);
		mesh.material = material;

		const sphereObjects = {
			0: { position: new Vector3(-0.25, 1.4, 1.6), diameter: 0.3 },
			1: { position: new Vector3(0.15, 3.5, 1), diameter: 0.3 },
			2: { position: new Vector3(0.15, 3.5, -1), diameter: 0.3 },
			3: { position: new Vector3(-0.25, 1.4, -1.6), diameter: 0.3 }
		};

		const magickNumbersPoints: drowedPointsI = {
			0: { x: 110, y: 100 },
			1: { x: 850, y: 260 },
			2: { x: 850, y: 770 },
			3: { x: 110, y: 920 }
		};

		Object.entries(sphereObjects).forEach(([key, value]) => {
			const sphere = createVectorSphere(
				scene,
				key,
				value.position,
				value.diameter,
				rootStyles
			);
			sphere.setParent(mesh);
			if (!sphere.metadata) {
				sphere.metadata = {};
			}

			sphere.metadata.graphicsPointPosition = magickNumbersPoints[key];
		});

		return mesh;
	};

	const graphicModels = await Promise.all(
		Object.entries(graphicModelsNames).map(async ([modelName, value]) => {
			return await createGraphicModel(
				modelName,
				value.position,
				value.rotation,
				scene,
				value.boxSize
			);
		})
	);

	return graphicModels;
};

const createVectorSphere = (
	scene: Scene,
	indexName: string,
	position: Vector3,
	diameter: number = 1,
	rootStyles: CSSStyleDeclaration
): Mesh => {
	const color =
		rootStyles.getPropertyValue('--button-text') || 'rgba(255, 0, 0, 1)';
	const sphere = MeshBuilder.CreateSphere(
		'redSphere_' + indexName,
		{ diameter: diameter },
		scene
	);
	sphere.position = position;
	const material = new StandardMaterial('redMaterial', scene);
	material.diffuseColor = toColor3(color);
	sphere.material = material;

	sphere.actionManager = new ActionManager(scene);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
			changeMeshVisibility(sphere, 0, true, 300);

			const canvasTexture = (
				(sphere.parent as AbstractMesh).material as StandardMaterial
			).diffuseTexture as DynamicTexture;

			drawPointOnTexture(
				indexName,
				canvasTexture,
				sphere.metadata.graphicsPointPosition.x || 0,
				sphere.metadata.graphicsPointPosition.y || 0,
				5,
				rootStyles
			);

			const pointsArray = Array.from(drowedPoints.values());
			if (pointsArray.length > 1) {
				const lastPoint = pointsArray[pointsArray.length - 1];
				const prevPoint = pointsArray[pointsArray.length - 2];

				drawLineOnTexture(
					canvasTexture,
					prevPoint.x,
					prevPoint.y,
					lastPoint.x,
					lastPoint.y,
					5,
					rootStyles
				);

				if (pointsArray.length === 4) {
					const firstPoint = pointsArray[0];
					drawLineOnTexture(
						canvasTexture,
						lastPoint.x,
						lastPoint.y,
						firstPoint.x,
						firstPoint.y,
						5,
						rootStyles
					);
				}
			}
		})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {})
	);
	sphere.actionManager.registerAction(
		new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {})
	);

	return sphere;
};

export function changeVectorModelsColor(
	graphicModelsNames: GraphicsModelsT,
	loadedNodes: LoadedNodesType
) {
	const keys1 = Object.keys(graphicModelsNames);
	const keys2 = Object.keys(loadedNodes);
	const commonKeys = keys1.filter(key => keys2.includes(key));
	const result: LoadedNodesType = {};
	commonKeys.forEach(key => {
		result[key] = loadedNodes[key];
	});
	Object.entries(result).forEach(([, node]) => {
		const mesh = node.node as AbstractMesh;
		const rootStyles = getComputedStyle(document.documentElement);
		const bgColor =
			rootStyles.getPropertyValue('--button-bg') || 'rgba(255, 255, 255, 1)';
		const lineColor =
			rootStyles.getPropertyValue('--button-text') || 'rgba(0, 0, 0, 1)';
		if (mesh) {
			const texture = (mesh.material as StandardMaterial)
				.diffuseTexture as DynamicTexture;
			if (texture) {
				const context = texture.getContext();
				context.fillStyle = bgColor;
				context.fillRect(0, 0, 1024, 1024);
				texture.update();
			}
		}
		const meshChildren = mesh.getChildMeshes();
		if (meshChildren.length > 0) {
			meshChildren.forEach(child => {
				if (child.material && child.material instanceof StandardMaterial) {
					child.material.diffuseColor = toColor3(lineColor);
				}
			});
		}
	});
}

const drawPointOnTexture = (
	indexName: string,
	texture: DynamicTexture,
	x: number,
	y: number,
	size: number = 5,
	rootStyles: CSSStyleDeclaration
) => {
	const color =
		rootStyles.getPropertyValue('--button-text') || 'rgba(255, 0, 0, 1)';
	const context = texture.getContext();
	context.beginPath();
	context.arc(x, y, size, 0, 2 * Math.PI);
	context.fillStyle = color;
	context.fill();
	context.closePath();
	texture.update();
	drowedPoints.set(indexName, { x: x, y: y });
};

const drawLineOnTexture = (
	texture: DynamicTexture,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	width: number = 5,
	rootStyles: CSSStyleDeclaration
) => {
	const color =
		rootStyles.getPropertyValue('--button-text') || 'rgba(255, 0, 0, 1)';
	const context = texture.getContext();
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.lineWidth = width;
	context.strokeStyle = color;
	context.stroke();
	context.closePath();
	texture.update();
};
