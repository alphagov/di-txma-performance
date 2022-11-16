const { build } = require("esbuild");
const glob = require('glob');
const outbase = './src';
const outdir = './dist';

build({
    entryPoints: glob.sync('src/*.ts'),
    outbase,
    outdir,
    target: 'es6',
    format: 'esm',
    bundle: true,
    sourcemap: true,
    watch: false,
    minify: false,
    external: ["k6*", "https://*"],
})
.then(() => {
    console.log("Transpiled files generated:");
    glob.sync(outdir + '/*').forEach(file => {
        console.log(`+ \x1b[32m${file}\x1b[0m`)
    });
})
.catch(() => process.exit(1));

