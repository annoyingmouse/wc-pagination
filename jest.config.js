export default {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["./jest.setup.js"],
  /**
   * This following causes issues with `np`
   */
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageReporters: ["text", "lcov", "html"],
  //
  // // Only collect coverage from the component file:
  // collectCoverageFrom: ["**/wc-pagination.js"],
  //
  // // Optional: fail builds if coverage drops below target
  // coverageThreshold: {
  //   "**/wc-pagination.js": {
  //     branches: 80,
  //     functions: 85,
  //     lines: 90,
  //     statements: 90,
  //   },
  // },
};
