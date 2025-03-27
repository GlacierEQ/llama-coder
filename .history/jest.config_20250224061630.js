module.exports = {
.	// Testing Presets
	preset: 'ts-jest',

	// Environment & Setup
	testEnvironment: 'node',
	testPathIgnorePatterns: ["/node_modules/", "/out/"],
	setupFiles: ['./jest.setup.js'],

	// Coverage Configuration
	collectCoverage: true,
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov'],
};
