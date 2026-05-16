function fnv1a(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
    }
    return hash;
}

function mulberry32(seed: number): () => number {
    let s = seed;
    return (): number => {
        s += 0x6d2b79f5;
        let z = s;
        z = Math.imul(z ^ (z >>> 15), z | 1);
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
    const rng = mulberry32(fnv1a(seed));
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        // noUncheckedIndexedAccess: i and j are in-bounds by Fisher-Yates invariant
        const tmp = arr[i] as T;
        arr[i] = arr[j] as T;
        arr[j] = tmp;
    }
    return arr;
}

export function buildQuestionSeed(attemptKey: string, examId: string): string {
    return `${attemptKey}:${examId}:q`;
}
