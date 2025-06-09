/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest', {
            jsc: {
                parser: { syntax: 'typescript', tsx: false, decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
                target: 'es2019'
            }
        }],
    },
    coverageThreshold: {
        global: {
            branches: 20,
            statements: 20,
        },
    },
    collectCoverage: false,
    coverageProvider: 'v8',
    coverageReporters: ['json', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['node_modules/', '__tests__/data/', 'src/models.ts'],
};
