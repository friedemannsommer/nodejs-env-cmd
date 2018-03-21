# nodejs-env-cmd
> Loads an ".env" file and passes these environment options to a given process

## Install
```bash
npm i -g nodejs-env-cmd
```

## Usage
By default the package will try to load the ".env" file in the current working directory
```bash
env-cmd node path/to/my/code.js
```
You can pass the path to the "env" file through the `--envFile` option
```bash
env-cmd --envFile ./path/to/my/env.file node path/to/my/code.js
```