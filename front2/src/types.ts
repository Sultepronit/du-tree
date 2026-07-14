export type DataNode = {
    name: string
    type: string
    size: number
    temp?: number
    locked?: number
    linkPath?: string
    nlink?: number
    content?: DataNode[]
    contentCount?: number
}

export type ElNode = {
    shoot: HTMLDivElement
    size?: HTMLDivElement
    entry?: HTMLDivElement
}

export type UpdateBranch = {
    dataShoots: Map<string, DataNode>
    elShoots?: Map<string, ElNode>
    ul?: HTMLUListElement
    pages?: number
}
