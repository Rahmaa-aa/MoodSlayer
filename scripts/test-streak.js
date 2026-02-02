const { calculateStreak } = require('./lib/services/gamificationService');

// Mock data: Entries for Jan 23-27
const entries = [
    { date: new Date('2026-01-27T22:00:00Z'), data: { mood: 'Happy' } },
    { date: new Date('2026-01-26T22:00:00Z'), data: { mood: 'Happy' } },
    { date: new Date('2026-01-25T22:00:00Z'), data: { mood: 'Happy' } },
    { date: new Date('2026-01-24T22:00:00Z'), data: { mood: 'Happy' } },
    { date: new Date('2026-01-23T22:00:00Z'), data: { mood: 'Happy' } },
];

console.log('Today (Local):', new Date().toLocaleString());
console.log('ISO Today:', new Date().toISOString());

const streak = calculateStreak(entries);
console.log('Calculated Streak:', streak);

const getDateString = (date) => new Date(date).toISOString().split('T')[0];
console.log('Today String:', getDateString(new Date()));
console.log('Last Entry String:', getDateString(entries[0].date));
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
console.log('Yesterday String:', getDateString(yesterday));
