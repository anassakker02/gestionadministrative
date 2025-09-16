// eslint.config.js
module.exports = [
  // Ignorer certains dossiers
  { ignores: ["lib", "node_modules"] },

  // Configs ESLint de base
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
