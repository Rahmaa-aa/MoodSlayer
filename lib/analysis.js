export function analyzePatterns(entries) {
    if (!entries || entries.length < 5) return ["Keep logging! We need more data to spot patterns."];

    const patterns = []

    // Example: Check for "Social -> Sad" transition
    for (let i = 1; i < entries.length; i++) {
        const today = entries[i].data
        const yesterday = entries[i - 1].data

        if (yesterday.mood === 'Social' && today.mood === 'Sad') {
            patterns.push("Detected: Social crash often leads to a 'Sad' vibe.")
        }
    }

    // Example: Cycle correlation
    const lutealMoods = entries.filter(e => e.cycleDay > 20).map(e => e.data.mood)
    if (lutealMoods.includes('Sad') || lutealMoods.includes('Quiet')) {
        patterns.push("Pattern: Your Luteal phase (Day 20+) is often 'Quiet' or 'Sad'.")
    }

    return patterns.length > 0 ? patterns : ["No strong patterns yet. Keep it up!"]
}
