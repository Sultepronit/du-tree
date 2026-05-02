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

export type Shoot = {
    size: number
    li: HTMLLIElement
    text?: HTMLDivElement
    // bar?: HTMLDivElement
}

// export type Branch4 = Record<string, Shoot>
export type Branch4 = {
    ul: HTMLUListElement
    shoots: Record<string, Shoot>
}
