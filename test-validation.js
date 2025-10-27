import SeedFileAndInitializationValidator from './scripts/validate-seed-file-and-initialization.js';

console.log('Starting validation test...');

async function test() {
  try {
    const validator = new SeedFileAndInitializationValidator();
    await validator.validateSeedFileAndInitialization();
    console.log('Validation completed successfully!');
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

test();