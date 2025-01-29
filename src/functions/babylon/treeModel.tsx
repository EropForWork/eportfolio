import {
	AbstractMesh,
	Color3,
	DynamicTexture,
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
import { addMeshMetadata, ModelGroupsI, toColor3 } from './models';

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
		console.log(commitMap[name].metadata);
	});

	Object.entries(commits).forEach(([name, value]) => {
		if (value.parentId && commits[value.parentId]) {
			createCommitLink(
				scene,
				commitMap[name],
				commitMap[value.parentId],
				lineColor
			);
		}
	});

	const gitButtons = scene.meshes.find(mesh => mesh.name === 'gitButtons');
	if (gitButtons) {
		gitButtons.parent = meshContainer;
		console.log(gitButtons);
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
	const points = [commitNode.position, parentCommitNode.position];
	const lines = MeshBuilder.CreateLines('lines', { points: points }, scene);
	lines.color = color3;
	lines.parent = commitNode.parent;
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
