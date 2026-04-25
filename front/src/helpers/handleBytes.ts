export default function handleBytes(bytes: number) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    // const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const sizes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // const value = (bytes / k**i).toFixed(2)
    const value = (bytes / k**i).toPrecision(3)

    return `${value} ${sizes[i]}`;
}