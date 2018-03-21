#!/usr/bin/env node
import envCommand from '../index'

function parseArgs(args: string[]): void {
    const envFileOptionIndex = args.indexOf('--envFile')
    let envFile = '.env'

    if (envFileOptionIndex !== -1) {
        envFile = args.splice(envFileOptionIndex, 2)[1]
    }

    envCommand(args[0], args.slice(1), {
        closeAfterFinish: true,
        envFilePath: envFile
    }).catch((err: Error) => {
        console.error(err)
        process.exit(1)
    })
}

parseArgs(process.argv.slice(2))
