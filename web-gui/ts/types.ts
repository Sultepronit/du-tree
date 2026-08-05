export type PathSugg = {
    name: string
    link?: string
    isLocked?: true
    isEmpty?: true
}
export type PathDetails = {
    inputPath: string
    workingPath?: string
    replacement?: [string, string]
    nextDirs?: PathSugg[]
    isLocked?: true
    isRemoved?: true
}

export type ReqOptions = {
    // blockSize?: true
    blockSize?: boolean
    excludeHidden?: boolean
}

export type DataNode = {
    name: string
    type: string
    size: number
    temp?: number
    locked?: number
    linkPath?: string
    nlink?: number
    isNeglected?: true
    content?: DataNode[]
    contentCount?: number
}

export type ViewNode = {
    shoot: HTMLDivElement
    size?: HTMLDivElement
}

export type UpdateBranch = {
    dataShoots: Map<string, DataNode>
    viewShoots?: Map<string, ViewNode>
    ul?: HTMLUListElement
    pages?: number
}
