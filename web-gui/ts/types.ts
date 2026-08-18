export type SystemContext = {
    isRoot: boolean
    user?: string
    host?: string
}

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
    blockSize?: boolean
    oneFS?: boolean
    excludeHidden?: boolean
    exPatt?: string[]
}

export type DataNode = {
    name: string
    type: string
    size: number
    modTime: number
    scanTime: number
    temp?: number
    locked?: number
    linkPath?: string
    nlink?: number
    isNeglected?: true
    content?: DataNode[]
    // contentCount?: number
}

export type DataBranch = {
    name?: string
    size?: number
    temp?: number
    locked?: number
    content?: DataNode[]
    contentCount?: number
    isFiltered?: true
    hiddenItems?: number
    hiddenSize?: number
}

export type ViewNode = {
    data: DataNode
    shoot?: HTMLDivElement
    sizeVidget?: HTMLDivElement
    nameVidget?: HTMLDivElement
}

export type ViewBranch = {
    size: number
    data: DataNode[]
    // isFull?: true // need?
    filtered?: DataNode[]
    hiddenItems?: number
    hiddenSize?: number
    // limit?: number
    viewNodesIndex: Map<string, ViewNode>
    store: DocumentFragment
    hiddenSummary?: ViewNode
    ul?: HTMLUListElement
}
