// "Ready for more": for a daily Expected activity a child has done steadily, the
// slightly harder activity to offer next. Names match the content library (see
// contentLibrary.ts); anything not listed here simply never gets a suggestion.
// Hygiene items (brushing teeth) are left out on purpose, there is no harder step.
export interface NextStep {
  name: string;
  frequency: 'daily' | 'weekly';
}

const RAW: [string, NextStep][] = [
  ['Make your bed (with help)', { name: 'Make your bed', frequency: 'daily' }],
  ['Put toys away before bed', { name: 'Tidy your room with a grown-up', frequency: 'weekly' }],
  ['Clear your plate after meals', { name: 'Put your own dishes in the dishwasher', frequency: 'daily' }],
  ['Put backpack and shoes by the door', { name: 'Pack your own backpack for school', frequency: 'daily' }],
  ['Make your bed', { name: 'Change your own sheets', frequency: 'weekly' }],
  ['Pack your own backpack for school', { name: 'Pack your own lunch', frequency: 'daily' }],
  ['Put dirty clothes in the hamper', { name: 'Put away your own clean laundry', frequency: 'weekly' }],
  ['Clear your place and load into dishwasher after meals', { name: 'Unload the dishwasher', frequency: 'daily' }],
  ['Set the table for dinner', { name: 'Clear the table after dinner', frequency: 'daily' }],
  ['Homework before screen time', { name: 'Manage your own screen-time limit', frequency: 'daily' }],
  ['Pack your own lunch', { name: 'Help make dinner one night a week', frequency: 'weekly' }],
];

const LADDER = new Map<string, NextStep>(RAW.map(([from, next]) => [from.toLowerCase(), next]));

export function nextStepFor(activityName: string): NextStep | undefined {
  return LADDER.get(activityName.trim().toLowerCase());
}
