export type DataNode = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    locked?: number
    linkPath?: string
    content?: DataNode[]
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
}
