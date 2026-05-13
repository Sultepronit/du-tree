export type Node = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    content?: Node[]
}

export type Shoot = {
    li: HTMLLIElement
    sizeDisplay?: HTMLDivElement
}

export type Branch = {
    ul: HTMLUListElement
    shoots: Record<string, Shoot>
}
