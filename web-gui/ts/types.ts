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

// export type HiddenSummaryView = {
//     hiddenItems?: number
//     hiddenSize?: number
//     shoot?: HTMLDivElement
//     sizeVidget?: HTMLDivElement
//     nameVidget?: HTMLDivElement
// }

export type ViewBranch = {
    size: number
    data: DataNode[]
    filtered?: DataNode[]
    isFull?: true
    pages?: number
    // dataNodesIndex: Map<string, DataNode>
    viewNodesIndex: Map<string, ViewNode>
    hiddenSummary?: ViewNode
    // hiddenSummary?: HiddenSummaryView
    hiddenItems?: number
    hiddenSize?: number
    ul?: HTMLUListElement
}
