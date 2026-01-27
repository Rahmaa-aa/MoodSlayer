/**
 * Dummy Data Generator for MoodSlayer ML Testing
 * Generates 30 days of realistic, patterned data.
 */

const fs = require('fs');
const path = require('path');

const generateDummyData = () => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const trackables = [
        { id: 'touch_grass', name: 'Touch Grass', type: 'boolean', category: 'Mental Health' },
        { id: 'rotting_time', name: 'Rotting Time', type: 'number', category: 'Self Care', unit: 'HRS' },
        { id: 'gym_log', name: 'Gym Log', type: 'boolean', category: 'Fitness' },
        { id: 'daily_mantra', name: 'Daily Mantra', type: 'boolean', category: 'Mindfulness' }
    ];

    for (let i = 0; i < 31; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

        // Create a pattern
        // Pattern 1: High "Touch Grass" + Low "Rotting Time" = Happy Mood
        // Pattern 2: Gym on Mon, Wed, Fri increases Mood
        // Pattern 3: High Rotting Time on weekends

        let mood = 'Chill';
        const touchGrass = Math.random() > 0.3; // 70% chance
        let rottingTime = dayOfWeek === 0 || dayOfWeek === 6 ? 4 + Math.random() * 4 : Math.random() * 3;
        const gym = [1, 3, 5].includes(dayOfWeek);
        const mantra = Math.random() > 0.5;

        // Logic for mood score
        let score = 2; // Default Chill
        if (touchGrass) score += 1;
        if (gym) score += 1;
        if (rottingTime > 5) score -= 1;
        if (mantra) score += 0.5;

        if (score >= 3.5) mood = 'Happy';
        else if (score >= 3) mood = 'Energetic';
        else if (score >= 2) mood = 'Chill';
        else mood = 'Sad';

        data.push({
            date: date.toISOString(),
            data: {
                mood,
                touch_grass: touchGrass,
                rotting_time: Number(rottingTime.toFixed(1)),
                gym_log: gym,
                daily_mantra: mantra
            }
        });
    }

    return data;
};

const dummyEntries = generateDummyData();
const outputPath = path.join(__dirname, 'dummy_ml_data.json');
fs.writeFileSync(outputPath, JSON.stringify(dummyEntries, null, 2));
console.log(`Generated 30 days of patterned dummy data at: ${outputPath}`);
