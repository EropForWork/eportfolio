import {
	AbstractMesh,
	ActionManager,
	Color3,
	DynamicTexture,
	ExecuteCodeAction,
	Mesh,
	MeshBuilder,
	Scene,
	StandardMaterial,
	Tools,
	Vector3
} from 'babylonjs';
import {
	GitGraphValueI,
	GitGraphValuesType
} from '../../components/SkillsContext';
import {
	addMeshMetadata,
	animateMeshProperty,
	changeMeshVisibility,
	ModelGroupsI,
	toColor3
} from './models';
import earcut from 'earcut';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).earcut = earcut;

export function buildCommitTree(
	scene: Scene,
	commits: GitGraphValuesType,
	modelGroups: ModelGroupsI
) {
	const rootStyles = getComputedStyle(document.documentElement);
	const lineColor: Color3 = toColor3(
		rootStyles.getPropertyValue('--button-text') || 'rgba(0, 0, 0, 1)'
	);
	const meshContainer = new Mesh('commitModel', scene);
	meshContainer.position = new Vector3(0, 0.01, 0);
	meshContainer.scaling = new Vector3(1.5, 1.5, 1.5);

	addMeshMetadata(
		meshContainer,
		modelGroups,
		0,
		meshContainer,
		meshContainer.name,
		meshContainer.name
	);

	meshContainer.rotation = new Vector3(0, Tools.ToRadians(90), 0);
	const commitMap: { [name: string]: AbstractMesh } = {};
	Object.entries(commits).map(([name, value]) => {
		commitMap[name] = createCommitNode(
			scene,
			meshContainer,
			name,
			value,
			commits,
			lineColor
		);
		addMeshMetadata(
			commitMap[name],
			modelGroups,
			value.visibility && 1,
			meshContainer,
			meshContainer.name,
			meshContainer.name
		);
		addMeshMetadata(
			commitMap[name].getChildMeshes()[0],
			modelGroups,
			value.visibility && 1,
			meshContainer,
			meshContainer.name,
			meshContainer.name
		);
	});

	Object.entries(commits).forEach(([name, value]) => {
		if (value.parentId && commits[value.parentId]) {
			const lines = createCommitLink(
				scene,
				commitMap[name],
				commitMap[value.parentId],
				lineColor
			);
			addMeshMetadata(
				lines,
				modelGroups,
				value.visibility && 1,
				meshContainer,
				meshContainer.name,
				meshContainer.name
			);
		}
	});

	const gitButtons = scene.meshes.find(mesh => mesh.name === 'gitButtons');
	if (gitButtons) {
		gitButtons.parent = meshContainer;
		const planeText = gitButtons
			.getChildMeshes()
			.find(mesh => mesh.name === 'Plane');
		if (planeText) {
			planeText.dispose();
			create3dText('commit', scene, 0.3).then(mesh => {
				if (!mesh) {
					return;
				}
				mesh.parent = gitButtons;
				mesh.rotation.y = Tools.ToRadians(270);
				mesh.position = new Vector3(-0.1, 0.33, -0.6);
				mesh.visibility = 0;
				addMeshMetadata(
					mesh,
					modelGroups,
					1,
					meshContainer,
					meshContainer.name,
					meshContainer.name
				);
			});
		}
		const button = gitButtons
			.getChildMeshes()
			.find(mesh => mesh.name === 'Cylinder');
		if (button) {
			button.actionManager = new ActionManager(scene);
			button.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
					if (button.metadata?.clicks < button.metadata?.clickActions.length) {
						animateMeshProperty(button, 'position', 'x', -0.28, 0.3);
					}
				})
			);
			button.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
					animateMeshProperty(button, 'position', 'x', -0.327, 0.3);
				})
			);
			button.metadata.clickActions = [
				{ name: 'commit', nodes: ['commit5'] },
				{ name: 'merge', nodes: ['commit6', 'commit7'] }
			];
			button.metadata.clicks = 0;
			button.actionManager.registerAction(
				new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
					if (button.metadata.clicks < button.metadata?.clickActions.length) {
						animateMeshProperty(button, 'position', 'x', -0.15, 0.2);
						gitBtnClick(button, commitMap);
					}
					if (button.metadata.clicks === button.metadata?.clickActions.length) {
						changeGitBtnText(button, 'DONE!');
					}
				})
			);
		}
	}

	return meshContainer;
}

function createCommitNode(
	scene: Scene,
	parent: AbstractMesh,
	name: string,
	commit: GitGraphValueI,
	commits: GitGraphValuesType,
	color3: Color3
) {
	const sphere: AbstractMesh = MeshBuilder.CreateSphere(
		name,
		{ diameter: 0.1 },
		scene
	);
	const position = calculatePosition(commit, commits);
	sphere.position = position;
	sphere.parent = parent;

	const material = new StandardMaterial('material', scene);
	material.diffuseColor = color3;
	sphere.material = material;

	const dynamicTexture = new DynamicTexture('dynamicTexture', 524, scene, true);
	dynamicTexture.hasAlpha = true;
	const textureContext = dynamicTexture.getContext();
	textureContext.font = 'bold 28px Arial';
	textureContext.fillStyle = 'white';
	textureContext.fillText(commit.message, 70, 220);
	dynamicTexture.update();

	const plane = MeshBuilder.CreatePlane('plane', { width: 2, height: 2 }, scene);
	plane.position = new Vector3(0, 0, -0.1);
	const materialPlane = new StandardMaterial('textMaterial', scene);
	materialPlane.diffuseTexture = dynamicTexture;
	materialPlane.alphaMode = 1;
	plane.material = materialPlane;
	plane.parent = sphere;
	return sphere;
}

function createCommitLink(
	scene: Scene,
	commitNode: AbstractMesh,
	parentCommitNode: AbstractMesh,
	color3: Color3
) {
	const points = [
		new Vector3(0, 0, 0),
		parentCommitNode.position.subtract(commitNode.position)
	];
	const lines = MeshBuilder.CreateLines('lines', { points: points }, scene);
	lines.color = color3;
	lines.parent = commitNode;
	return lines;
}

function calculatePosition(
	commit: GitGraphValueI,
	commits: GitGraphValuesType
): Vector3 {
	if (commit.position && commit.parentId === '') {
		return commit.position;
	}

	if (commit.parentId && commits[commit.parentId]) {
		const parentCommit = commits[commit.parentId];
		const parentPosition = calculatePosition(parentCommit, commits);
		const vector3 = new Vector3(
			parentPosition.x,
			parentPosition.y + 0.6,
			parentPosition.z
		).add(commit.position || new Vector3(0, 0, 0));
		return vector3;
	}

	return new Vector3(0, 0, 0);
}

async function create3dText(
	text: string,
	scene: Scene,
	size: number = 0.5,
	color: Color3 = new Color3(1, 0, 0)
) {
	const fontData = await (
		await fetch('./babylon/Droid Sans_Regular.json')
	).json();
	const textOptions = {
		size: size,
		depth: 0.1
	};
	const textMesh = MeshBuilder.CreateText(
		'text',
		text,
		fontData,
		textOptions,
		scene
	);
	const textMaterial = new StandardMaterial('textMaterial', scene);
	textMaterial.diffuseColor = color;
	if (textMesh) {
		textMesh.material = textMaterial;
	}
	return textMesh;
}

function gitBtnClick(
	clickedMesh: AbstractMesh,
	commitMap: {
		[name: string]: AbstractMesh;
	}
) {
	const clickNames: string[] =
		clickedMesh.metadata.clickActions[clickedMesh.metadata.clicks]?.nodes;
	if (clickNames) {
		clickNames.forEach(names => {
			const mesh = commitMap[names];
			changeMeshVisibility(mesh, 1, true, 300, true);
		});
	}

	changeGitBtnClicks(clickedMesh);
}

export function changeGitBtnClicks(
	mesh: AbstractMesh | string,
	reset: boolean = false,
	scene?: Scene
) {
	const btnMesh =
		mesh instanceof AbstractMesh ? mesh : scene?.getMeshByName(mesh);
	if (!btnMesh) {
		return;
	}
	if (reset) {
		btnMesh.metadata.clicks = 0;
	} else {
		++btnMesh.metadata.clicks;
	}
	changeGitBtnText(btnMesh);
}

function changeGitBtnText(mesh: AbstractMesh, newtext: string = '') {
	const btnName: string =
		mesh.metadata.clickActions[mesh.metadata.clicks]?.name || newtext;
	if (!btnName) {
		return;
	}
	const textMesh = mesh.parent?.parent
		?.getChildMeshes()
		.find(mesh => mesh.name === 'text');
	if (!textMesh) {
		return;
	}

	create3dText(newtext || btnName, mesh.getScene(), 0.3).then(newTextMesh => {
		if (newTextMesh) {
			newTextMesh.parent = textMesh.parent;
			newTextMesh.position = textMesh.position;
			newTextMesh.position.y = btnName === 'merge' ? 0.235 : 0.33;
			newTextMesh.rotation = textMesh.rotation;
			newTextMesh.scaling = textMesh.scaling;
			newTextMesh.visibility = mesh.metadata.visibility;
			newTextMesh.metadata = { ...textMesh.metadata };
			textMesh.dispose();
		}
	});
}
