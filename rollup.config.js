import typescript from 'rollup-plugin-typescript2';
import scss from 'rollup-plugin-scss';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          outDir: 'dist',
        },
      },
    }),
    scss({ output: 'dist/styles.min.css' }),
  ],
};