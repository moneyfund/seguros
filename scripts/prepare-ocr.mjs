import {mkdir,copyFile,readdir,rm} from 'node:fs/promises';import {resolve,join} from 'node:path';
const root=resolve('public/ocr');await rm(root,{recursive:true,force:true});await mkdir(join(root,'core'),{recursive:true});await mkdir(join(root,'lang'),{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js',join(root,'worker.min.js'));
const core='node_modules/tesseract.js-core';const files=(await readdir(core)).filter(x=>/^tesseract-core.*\.wasm(?:\.js)?$/.test(x));if(!files.includes('tesseract-core-lstm.wasm.js')||!files.includes('tesseract-core-simd-lstm.wasm.js'))throw Error('Missing local OCR WASM engines');for(const file of files)await copyFile(join(core,file),join(root,'core',file));
await copyFile('node_modules/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz',join(root,'lang','spa.traineddata.gz'));console.log('Local OCR assets prepared');
