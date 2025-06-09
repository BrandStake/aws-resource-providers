/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['reflect-metadata'],
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', {
            tsconfig: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
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
