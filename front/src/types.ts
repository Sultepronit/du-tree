export type DataNode = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    locked?: number
    content?: DataNode[]
}

export type Shoot = {
    el: HTMLDivElement
    sizeDisplay?: HTMLDivElement
}

export type Branch = {
    ul: HTMLUListElement
    shoots: Record<string, Shoot>
}

export type elNode = {
    shoot: HTMLDivElement
    size?: HTMLDivElement
}

export type UpdateBranch = {
    dataShoots: DataNode[]
    dataShootsMap: Map<string, DataNode>
    elNodes?: Map<string, elNode>
    shoots?: {
        data: DataNode
        dom?: elNode
    }[]
    ul?: HTMLUListElement
}
