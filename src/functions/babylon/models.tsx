import { AbstractMesh, Node } from 'babylonjs';

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

export const delay = (ms: number) =>
	new Promise(resolve => setTimeout(resolve, ms));
