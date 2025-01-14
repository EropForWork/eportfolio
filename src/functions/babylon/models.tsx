import { AbstractMesh, Node } from 'babylonjs';

export const changeMeshVisibility = (node: Node, visibility: number): void => {
	if (node instanceof AbstractMesh) {
		node.visibility = visibility;
		node.isPickable = visibility === 0 ? false : true;
	}
	node.getChildren().forEach(child => {
		changeMeshVisibility(child, visibility);
	});
};
