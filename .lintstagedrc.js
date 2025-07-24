module.exports = {
  // Lint and fix TypeScript/JavaScript files
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  // Format other files
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
