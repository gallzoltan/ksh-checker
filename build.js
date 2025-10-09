const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

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

async function createBundle(shouldMinify = true) {
  console.log('Creating JavaScript bundle...\n');

  let bundleCode = '';
  let totalOriginalSize = 0;

  // Concatenate all JS files in order
  for (const file of JS_FILES_ORDER) {
    const filePath = path.join(JS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Error: ${file} not found!`);
      process.exit(1);
    }

    const code = fs.readFileSync(filePath, 'utf8');
    totalOriginalSize += code.length;

    console.log(`  Adding: ${file} (${(code.length / 1024).toFixed(2)} KB)`);

    // Add file separator comment and code
    bundleCode += `// === ${file} ===\n${code}\n\n`;
  }

  console.log(`\nTotal bundle size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);

  // Minify if requested
  if (shouldMinify) {
    console.log('Minifying bundle...');

    try {
      const result = await minify(bundleCode, {
        compress: {
          dead_code: true,
          drop_console: true,  // Remove console.log in production
          drop_debugger: true,
          keep_classnames: false,
          keep_fnames: false,
          passes: 2,  // Two passes for better compression
          pure_funcs: ['console.log', 'console.info', 'console.debug']  // Mark as pure functions
        },
        mangle: {
          keep_classnames: false,
          keep_fnames: false
        },
        format: {
          comments: false
        }
      });

      const outputPath = path.join(DIST_JS_DIR, 'bundle.min.js');
      fs.writeFileSync(outputPath, result.code, 'utf8');

      const minifiedSize = (result.code.length / 1024).toFixed(2);
      const savings = ((1 - result.code.length / totalOriginalSize) * 100).toFixed(1);

      console.log(`  ✓ Minified: ${minifiedSize} KB (${savings}% reduction)\n`);

      return 'bundle.min.js';
    } catch (error) {
      console.error(`  ✗ Error minifying bundle:`, error.message);
      process.exit(1);
    }
  } else {
    // Save non-minified bundle
    const outputPath = path.join(DIST_JS_DIR, 'bundle.js');
    fs.writeFileSync(outputPath, bundleCode, 'utf8');

    console.log(`  ✓ Bundle created (not minified)\n`);

    return 'bundle.js';
  }
}

function updateAndCopyHTML(bundleFileName) {
  console.log('Updating and copying index.html...');

  const htmlPath = path.join(__dirname, 'index.html');
  const distHtmlPath = path.join(DIST_DIR, 'index.html');

  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Replace individual script tags with single bundle script
  const scriptSectionRegex = /<!-- Application JavaScript files \(OOP structure\) -->[\s\S]*?<script src="js\/App\.js"><\/script>/;
  const bundleScript = `<!-- Application JavaScript bundle -->\n    <script src="js/${bundleFileName}"></script>`;

  htmlContent = htmlContent.replace(scriptSectionRegex, bundleScript);

  fs.writeFileSync(distHtmlPath, htmlContent, 'utf8');
  console.log('  ✓ index.html updated and copied\n');
}

async function build() {
  const shouldMinify = process.argv[2] !== '--debug';

  console.log('=== Building KSH Checker ===');
  console.log(`Mode: ${shouldMinify ? 'Production (minified)' : 'Debug (not minified)'}\n`);

  const bundleFileName = await createBundle(shouldMinify);
  updateAndCopyHTML(bundleFileName);

  console.log('=== Build complete! ===');
  console.log(`Output: ${DIST_DIR}/index.html`);
  console.log(`Bundle: ${DIST_JS_DIR}/${bundleFileName}`);
  console.log('You can open dist/index.html in your browser (works with file:// protocol)');
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
