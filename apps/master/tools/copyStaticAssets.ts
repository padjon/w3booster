import shell from 'shelljs'

//shell.rm('-R', 'dist/app/public');
shell.cp('-R', 'src/app/public', 'dist/app/public');
