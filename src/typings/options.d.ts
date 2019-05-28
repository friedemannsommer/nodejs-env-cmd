export interface IOptions extends Object {
    envFilePath: string
    closeAfterFinish: boolean
    preferParentEnv: boolean
    inheritParentEnv: boolean
    timeout: number
    pipeOutput: boolean
}
