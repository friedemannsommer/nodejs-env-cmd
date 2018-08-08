# nodejs-env-cmd
> Loads an ".env" file and passes these environment options to a given command

## Install
```bash
npm i -g nodejs-env-cmd
```

## Changelog
### v2.0.0
* Changed API to only support commands (e.g. `node ./path/to/my/file.js`)
* removed "cross-spawn" since we no longer support spawning files directly (except if the file is a binary or can be interpreted as one)

## Usage
By default the package will try to load the ".env" file in the current working directory
```bash
env-cmd node path/to/my/code.js
```
You can pass the path to the "env" file through the `--envFile` option
```bash
env-cmd --envFile ./path/to/my/env.file node path/to/my/code.js
```

## API
### CLI
Options
* envFile [optional]
    * pass a path to a env file (can be absolute or relative)
* timeout [optional]
    * pass a timeout for the command (this is in milliseconds)
* preferParentEnv [optional]
    * if a key exists in the parent (or global) environment use the value of the parent
### JS / TS
```typescript
import runCommand from 'nodejs-env-cmd'

const childProcess = runCommand('node /path/to/my/file.js', {
    envFilePath: '/path/to/my/env.file', // path to a env file (default: '.env') optional
    closeAfterFinish: false, // terminate host porcess after command has finished (default: false) [optional]
    preferParentEnv: false, // prefer the parent env (or global env) (default: false) [optional]
    timeout: 0 // time in milliseconds (default: 0) [optional]
})
```