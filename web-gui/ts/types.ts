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
    filteredItems?: number
    filteredSize?: number
}

export type ViewNode = {
    data: DataNode
    shoot?: HTMLDivElement
    sizeVidget?: HTMLDivElement
    nameVidget?: HTMLDivElement
}

export type ViewBranch = {
    data: DataNode[]
    size: number
    isFull?: true
    filtered?: DataNode[]
    // dataNodesIndex: Map<string, DataNode>
    viewNodesIndex: Map<string, ViewNode>
    ul?: HTMLUListElement
    pages?: number
}

export type FilterResults = {
    content?: DataNode[]
    filteredItems?: number
    filteredSize?: number
}
