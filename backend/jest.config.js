module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 👇 AQUI ESTÁ O SEGREDO
  roots: ['<rootDir>/src', '<rootDir>/test'],

  testRegex: '.*\\.spec\\.ts$',

  moduleFileExtensions: ['ts', 'js', 'json'],
};
