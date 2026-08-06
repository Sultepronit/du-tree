export default function arraysOfObjectsAreEqual(
    a: Record<string, unknown>[],
    b: Record<string, unknown>[]
) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false
    }
    return true
}
