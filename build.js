const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const JS_DIR = path.join(__dirname, 'js');
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_JS_DIR = path.join(DIST_DIR, 'js');

// Create dist directories
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}
if (!fs.existsSync(DIST_JS_DIR)) {
  fs.mkdirSync(DIST_JS_DIR);
}

async function minifyJSFiles() {
  console.log('Starting JavaScript minification...\n');

  const jsFiles = fs.readdirSync(JS_DIR).filter(file => file.endsWith('.js'));

  for (const file of jsFiles) {
    const inputPath = path.join(JS_DIR, file);
    const outputPath = path.join(DIST_JS_DIR, file);

    console.log(`Minifying: ${file}`);

    const code = fs.readFileSync(inputPath, 'utf8');

    try {
      const result = await minify(code, {
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true,
          keep_classnames: false,
          keep_fnames: false
        },
        mangle: {
          keep_classnames: false,
          keep_fnames: false
        },
        format: {
          comments: false
        }
      });

      fs.writeFileSync(outputPath, result.code, 'utf8');

      const originalSize = (code.length / 1024).toFixed(2);
      const minifiedSize = (result.code.length / 1024).toFixed(2);
      const savings = ((1 - result.code.length / code.length) * 100).toFixed(1);

      console.log(`  ✓ ${originalSize} KB → ${minifiedSize} KB (${savings}% reduction)\n`);
    } catch (error) {
      console.error(`  ✗ Error minifying ${file}:`, error.message);
      process.exit(1);
    }
  }
}

function copyHTML() {
  console.log('Copying index.html...');

  const htmlPath = path.join(__dirname, 'index.html');
  const distHtmlPath = path.join(DIST_DIR, 'index.html');

  fs.copyFileSync(htmlPath, distHtmlPath);
  console.log('  ✓ index.html copied\n');
}

async function build() {
  console.log('=== Building KSH Checker ===\n');

  await minifyJSFiles();
  copyHTML();

  console.log('=== Build complete! ===');
  console.log(`Output: ${DIST_DIR}/index.html`);
  console.log('You can open dist/index.html in your browser (works with file:// protocol)');
}

build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
