const test = require('node:test');
const assert = require('node:assert/strict');
const { ConfigManager, normalizeExtension } = require('../out/configManager');

test('normalizeExtension normalizes simple, compound, and uppercase formats', () => {
  // Simple extensions
  assert.strictEqual(normalizeExtension('php'), 'php');
  assert.strictEqual(normalizeExtension('.js'), 'js');
  assert.strictEqual(normalizeExtension('*.PHP'), 'php');

  // Variations: dot, uppercase, wildcard
  assert.strictEqual(normalizeExtension('.css'), 'css');
  assert.strictEqual(normalizeExtension('CSS'), 'css');
  assert.strictEqual(normalizeExtension('*.css'), 'css');

  // Compound extensions
  assert.strictEqual(normalizeExtension('blade.php'), 'blade.php');
  assert.strictEqual(normalizeExtension('*.blade.php'), 'blade.php');
  assert.strictEqual(normalizeExtension('.blade.php'), 'blade.php');
  assert.strictEqual(normalizeExtension('test.ts'), 'test.ts');
  assert.strictEqual(normalizeExtension('tar.gz'), 'tar.gz');

  // Input sanitization: empty string and whitespace
  assert.strictEqual(normalizeExtension('   '), '');
  assert.strictEqual(normalizeExtension(''), '');
  assert.strictEqual(normalizeExtension('  .html  '), 'html');
});

test('ConfigManager.isMatch matches simple, compound, and uppercase extensions', () => {
  const config = new ConfigManager(undefined, undefined, {
    fileExtensions: ['php', '.js', 'blade.php', 'test.ts', '*.css', 'html', '  ', ''],
    excludePatterns: ['**/vendor/**', 'storage/', '.git/']
  });

  // Simple extensions
  assert.strictEqual(config.isMatch('/path/to/script.js'), true);
  assert.strictEqual(config.isMatch('/path/to/index.php'), true);
  assert.strictEqual(config.isMatch('/path/to/style.css'), true);

  // Compound extensions
  assert.strictEqual(config.isMatch('/path/to/view.blade.php'), true);
  assert.strictEqual(config.isMatch('/path/to/app.test.ts'), true);

  // Uppercase extensions
  assert.strictEqual(config.isMatch('/path/to/INDEX.HTML'), true);
  assert.strictEqual(config.isMatch('/path/to/SCRIPT.JS'), true);

  // Non-matching files
  assert.strictEqual(config.isMatch('/path/to/image.png'), false);
  assert.strictEqual(config.isMatch('/path/to/notaphp'), false);
  assert.strictEqual(config.isMatch('/path/to/view.php.bak'), false);
});

test('ConfigManager.isMatch respects exclude pattern priority', () => {
  const config = new ConfigManager(undefined, undefined, {
    fileExtensions: ['php', 'js', 'html', 'blade.php'],
    excludePatterns: ['vendor', 'storage/', '**/.git/**']
  });

  // Excluded paths must return false even if extension matches
  assert.strictEqual(config.isMatch('/vendor/autoload.php'), false);
  assert.strictEqual(config.isMatch('/var/www/project/vendor/bundle.js'), false);
  assert.strictEqual(config.isMatch('C:\\project\\vendor\\autoload.php'), false);
  assert.strictEqual(config.isMatch('/app/storage/framework/views/cached.blade.php'), false);
  assert.strictEqual(config.isMatch('/project/.git/hooks/pre-commit.js'), false);

  // Non-excluded paths must match
  assert.strictEqual(config.isMatch('/app/controllers/HomeController.php'), true);
  assert.strictEqual(config.isMatch('/var/www/INDEX.HTML'), true);
});

test('ConfigManager handles dynamic real-time config updates without restart', () => {
  const config = new ConfigManager(undefined, undefined, {
    fileExtensions: ['js'],
    excludePatterns: []
  });

  assert.strictEqual(config.isMatch('/path/to/file.vue'), false);

  // Update configuration dynamically
  config.loadConfig({
    fileExtensions: ['js', 'vue', 'blade.php'],
    excludePatterns: []
  });

  assert.strictEqual(config.isMatch('/path/to/file.vue'), true);
  assert.strictEqual(config.isMatch('/path/to/welcome.blade.php'), true);
});
