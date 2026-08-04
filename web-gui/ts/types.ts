export type reqOptions = {
    blockSize?: true
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
