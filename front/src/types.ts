export type Node = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    content?: Node[]
}

export type Branch = {
    path: string
    node: Node
    nodeView?: HTMLLIElement
    sizeDisplay: HTMLDivElement
    vizualSizeDisplay?: HTMLDivElement
}

export type Branch2 = {
    path: string
    lis: HTMLLIElement[]
}
