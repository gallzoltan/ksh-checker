const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const JS_DIR = path.join(__dirname, 'js');
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_JS_DIR = path.join(DIST_DIR, 'js');

// JavaScript files in correct dependency order
const JS_FILES_ORDER = [
  'data.js',
  'Config.js',
  'NameNormalizer.js',
  'CacheManager.js',
  'DataProcessor.js',
  'Validator.js',
  'UIManager.js',
  'App.js'
];

// Create dist directories
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}
if (!fs.existsSync(DIST_JS_DIR)) {
  fs.mkdirSync(DIST_JS_DIR);
}

/**
 * Create a temporary entry point file that imports all modules in order
 * This ensures correct execution order while maintaining compatibility
 */
function createEntryPoint() {
  const entryPath = path.join(__dirname, '.entry.js');

  let entryContent = '// Auto-generated entry point for esbuild\n';
  entryContent += '// This file is temporary and will be deleted after build\n\n';

  // Import all files in order (as raw file reads to maintain IIFE compatibility)
  for (const file of JS_FILES_ORDER) {
    const filePath = path.join(JS_DIR, file);
    const code = fs.readFileSync(filePath, 'utf8');
    entryContent += `// === ${file} ===\n${code}\n\n`;
  }

  fs.writeFileSync(entryPath, entryContent, 'utf8');
  return entryPath;
}

/**
 * Update and copy index.html with bundle script reference
 */
function updateAndCopyHTML(bundleFileName) {
  console.log('Updating and copying index.html...');

  const htmlPath = path.join(__dirname, 'index.html');
  const distHtmlPath = path.join(DIST_DIR, 'index.html');

  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Replace individual script tags with single bundle script
  const scriptSectionRegex = /<!-- Application JavaScript files \(OOP structure\)[^\n]*-->[\s\S]*?<script src="js\/App\.js"><\/script>/;
  const bundleScript = `<!-- Application JavaScript bundle -->\n    <script src="js/${bundleFileName}"></script>`;

  htmlContent = htmlContent.replace(scriptSectionRegex, bundleScript);

  fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');
  console.log('  ✓ index.html updated and copied\n');
}

/**
 * Build with esbuild
 */
async function build() {
  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const isWatch = args.includes('--watch');

  console.log('=== Building KSH Checker with esbuild ===');
  console.log(`Mode: ${isDebug ? 'Debug (not minified)' : 'Production (minified)'}`);
  console.log(`Watch: ${isWatch ? 'Enabled' : 'Disabled'}\n`);

  // Create temporary entry point
  console.log('Creating bundle entry point...');
  const entryPath = createEntryPoint();
  console.log('  ✓ Entry point created\n');

  // Calculate original size
  let totalOriginalSize = 0;
  for (const file of JS_FILES_ORDER) {
    const filePath = path.join(JS_DIR, file);
    const code = fs.readFileSync(filePath, 'utf8');
    totalOriginalSize += code.length;
    console.log(`  ${file} (${(code.length / 1024).toFixed(2)} KB)`);
  }

  console.log(`\nTotal source size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);

  // Output file name
  const outputFileName = isDebug ? 'bundle.js' : 'bundle.min.js';
  const outputPath = path.join(DIST_JS_DIR, outputFileName);

  // esbuild configuration
  const buildOptions = {
    entryPoints: [entryPath],
    bundle: true,
    minify: !isDebug,
    sourcemap: isDebug ? 'inline' : false,
    target: ['es2015'],  // Support older browsers
    format: 'iife',      // Immediately Invoked Function Expression (no module system needed)
    outfile: outputPath,
    drop: isDebug ? [] : ['console', 'debugger'],  // Remove console.* and debugger in production
    legalComments: 'none',
    logLevel: 'info',
  };

  try {
    console.log(`\nBuilding with esbuild...`);

    if (isWatch) {
      // Watch mode
      const context = await esbuild.context(buildOptions);

      console.log('  ✓ Build complete');
      console.log(`  Output: ${outputPath}`);

      // Update HTML
      updateAndCopyHTML(outputFileName);

      console.log('\n🔍 Watch mode enabled - watching for changes...');
      console.log('Press Ctrl+C to stop\n');

      await context.watch();

      // Watch mode never exits until manual interrupt
      // Clean up handled by process.on('SIGINT')

    } else {
      // One-time build
      const result = await esbuild.build(buildOptions);

      // Get bundle size
      const bundleStats = fs.statSync(outputPath);
      const bundleSize = (bundleStats.size / 1024).toFixed(2);
      const savings = ((1 - bundleStats.size / totalOriginalSize) * 100).toFixed(1);

      console.log('  ✓ Build complete');
      console.log(`  Output size: ${bundleSize} KB (${savings}% reduction)\n`);

      // Update HTML
      updateAndCopyHTML(outputFileName);

      // Clean up temporary entry point
      fs.unlinkSync(entryPath);

      console.log('=== Build complete! ===');
      console.log(`Output: ${DIST_DIR}/index.html`);
      console.log(`Bundle: ${DIST_JS_DIR}/${outputFileName}`);
      console.log('You can open dist/index.html in your browser (works with file:// protocol)');
    }

  } catch (error) {
    console.error('\n✗ Build failed:', error.message);

    // Clean up temporary entry point on error
    if (fs.existsSync(entryPath)) {
      fs.unlinkSync(entryPath);
    }

    process.exit(1);
  }
}

// Handle Ctrl+C in watch mode
process.on('SIGINT', () => {
  console.log('\n\nBuild stopped by user');

  // Clean up temporary entry point
  const entryPath = path.join(__dirname, '.entry.js');
  if (fs.existsSync(entryPath)) {
    fs.unlinkSync(entryPath);
  }

  process.exit(0);
});

// Run build
build();
