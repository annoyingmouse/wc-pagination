export default {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["./jest.setup.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Only collect coverage from the component file:
  collectCoverageFrom: ["<rootDir>/wc-pagination.js"],

  // Optional: fail builds if coverage drops below target
  coverageThreshold: {
    "<rootDir>/wc-pagination.js": {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
};
