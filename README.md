# nodejs-env-cmd
> Loads an ".env" file and passes these environment options to a given command

## Install
```bash
npm i -g nodejs-env-cmd
```

## Changelog
### v3.0.0
* Changed CLI name from `env-cmd` to `nodejs-env-cmd`
* Added "inherit parent environment" option
* Added "pipe stdout and stderr" options
### v2.0.0
* Changed API to only support commands (e.g. `node ./path/to/my/file.js`)

## Usage
By default the package will try to load the ".env" file in the current working directory
```bash
nodejs-env-cmd node path/to/my/code.js
```
You can pass the path to the "env" file through the `--env-file` option
```bash
nodejs-env-cmd --envFile ./path/to/my/env.file node path/to/my/code.js
```

## API
### CLI
Options
* envFile [optional]
    * pass a path to a env file (can be absolute or relative)
    * aliases: `env-file`, `e`
* timeout [optional]
    * pass a timeout for the command (this is in milliseconds)
    * aliases: `t`
* preferParentEnv [optional]
    * if a key exists in the parent (or global) environment use the value of the parent
    * aliases: `prefer-parent-env`, `ppe`
* inheritParentEnv [optional]
    * copy parent environment variables to child envrionment
    * aliases: `inherit-parent-env`, `ipe`
### JS / TS
```typescript
import runCommand from 'nodejs-env-cmd'

const childProcess = runCommand('node /path/to/my/file.js', {
    envFilePath: '/path/to/my/env.file', // path to a env file (default: '.env') optional
    closeAfterFinish: false, // terminate host porcess after command has finished (default: false) [optional]
    preferParentEnv: false, // prefer the parent env (default: false) [optional]
    inheritParentEnv: true, // copy parent env variables (default: true) [optional]
    pipeOutput: true, // pipe child process stdout, stderr to process (default: true) [optional]
    timeout: 0 // time in milliseconds (default: 0) [optional]
})
```