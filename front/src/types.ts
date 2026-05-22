export type Node = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    locked?: number
    content?: Node[]
}

export type Shoot = {
    el: HTMLDivElement
    sizeDisplay?: HTMLDivElement
}

export type Branch = {
    ul: HTMLUListElement
    shoots: Record<string, Shoot>
}
