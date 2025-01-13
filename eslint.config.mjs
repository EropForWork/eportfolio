import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin'; // исправление импорта
import pluginReact from 'eslint-plugin-react';

export default [
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
	{ languageOptions: { globals: globals.browser } },
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	}
];
