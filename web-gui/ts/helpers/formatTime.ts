export default function formatTime(n: number) {
    return new Date(n).toLocaleString("sv-SE")
}
