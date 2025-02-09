import {
	AbstractMesh,
	Color3,
	DynamicTexture,
	PBRMaterial,
	Texture,
	Tools
} from 'babylonjs';

interface localObjectI {
	colorText: string;
	dynamicTexture: DynamicTexture | null;
	images: HTMLImageElement[];
}

const localObject: localObjectI = {
	colorText: '',
	dynamicTexture: null,
	images: []
};

export function loadComputerMesh(mesh: AbstractMesh) {
	function loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = url;

			img.onload = () => resolve(img);
			img.onerror = error => reject(error);
		});
	}

	function changeTexture(mesh: AbstractMesh) {
		const material: PBRMaterial = mesh.material as PBRMaterial;
		if (!material) {
			return;
		}
		const texture: Texture = material.albedoTexture as Texture;
		if (!texture) {
			return;
		}

		const textureImgUrl: string = (texture.url as string).replace('data:', '');
		if (!textureImgUrl) {
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = textureImgUrl;
		const vscodeImg = new Image();
		vscodeImg.crossOrigin = 'anonymous';
		vscodeImg.src = './babylon/models/textures/vscode.jpg';

		Promise.all([
			loadImage(textureImgUrl),
			loadImage('./babylon/models/textures/vscode.jpg')
		]).then(([firstImage, secondImage]) => {
			localObject.images = [firstImage, secondImage];
			const dynamicMaterial = material.clone('dynamicMaterialComputer');
			dynamicMaterial.emissiveColor = new Color3(0, 0, 0);
			const dynamicTexture: DynamicTexture = new DynamicTexture(
				'dynamicTextureComputer',
				1024,
				mesh.getScene(),
				false
			);
			dynamicTexture.uAng = Tools.ToRadians(180);
			localObject.dynamicTexture = dynamicTexture;
			const context = dynamicTexture.getContext();
			if (!context) {
				return;
			}

			drawComputerTexture();
			const rootStyles = getComputedStyle(document.documentElement);
			const bgColor = rootStyles.getPropertyValue('--button-bg') || '#FFFFFF';
			drawComputerText(bgColor);

			dynamicMaterial.albedoTexture = dynamicTexture;
			mesh.material = dynamicMaterial;
		});
	}

	const monitorMesh = mesh
		.getChildMeshes()
		.find(mesh => mesh.parent?.name === 'Computer_Low');
	if (!monitorMesh) {
		return;
	}

	changeTexture(monitorMesh);
}

function drawComputerTexture() {
	const { dynamicTexture, images } = localObject;
	const context = dynamicTexture?.getContext();
	if (!dynamicTexture || !images || images.length !== 2 || !context) {
		return;
	}
	context.clearRect(
		0,
		0,
		dynamicTexture.getSize().width,
		dynamicTexture.getSize().height
	);

	context.drawImage(
		images[0],
		0,
		0,
		dynamicTexture.getSize().width,
		dynamicTexture.getSize().height
	);
	context.save();
	context.translate(880, 260);
	context.rotate(Tools.ToRadians(90));
	context.scale(-1, 1);
	context.drawImage(
		images[1],
		-(images[1].width * 0.3) / 2,
		-(images[1].height * 0.3) / 2,
		images[1].width * 0.3,
		images[1].height * 0.3
	);
	dynamicTexture.update();
}

function drawComputerText(text: string) {
	const { dynamicTexture } = localObject;
	const context = dynamicTexture?.getContext();
	if (!dynamicTexture || !context) {
		return;
	}
	context.font = 'bold 8px Arial';
	context.fillStyle = 'white';
	context.fillText(text, -42, -42);
	localObject.colorText = text;
	context.restore();
	dynamicTexture.update();
}

window.addEventListener('keydown', e => {
	const allowedKeys = [
		'a',
		'A',
		'b',
		'B',
		'c',
		'C',
		'd',
		'D',
		'e',
		'E',
		'f',
		'F',
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'#',
		',',
		'.',
		'(',
		')',
		'Backspace'
	];

	const key = e.key;

	if (allowedKeys.includes(key)) {
		if (key === 'Backspace') {
			localObject.colorText = localObject.colorText.slice(0, -1);
		} else {
			localObject.colorText += key;
		}
		changeTextureText(localObject.colorText);
	}
});

export function changeTextureText(text: string) {
	if (!localObject.dynamicTexture) {
		return;
	}
	drawComputerTexture();
	drawComputerText(text);
	const skillContainer: HTMLDivElement = document.querySelector(
		'.skill-group-container'
	) as HTMLDivElement;
	if (!skillContainer) {
		return;
	}
	skillContainer.style.backgroundColor = text;
}
