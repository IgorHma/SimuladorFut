export const $ = id => document.getElementById(id);

export const refs = {
  homeName: $('homeName'), awayName: $('awayName'), homeStrength: $('homeStrength'), awayStrength: $('awayStrength'),
  homeStrengthValue: $('homeStrengthValue'), awayStrengthValue: $('awayStrengthValue'), homeDisplay: $('homeDisplay'), awayDisplay: $('awayDisplay'), rosterHomeName: $('rosterHomeName'), rosterAwayName: $('rosterAwayName'), rosterHomeCrest: $('rosterHomeCrest'), rosterAwayCrest: $('rosterAwayCrest'),
  homeCrest: $('homeCrest'), awayCrest: $('awayCrest'), stadium: $('stadium'), weather: $('weather'), stadiumDisplay: $('stadiumDisplay'), weatherDisplay: $('weatherDisplay'),
  button: $('simulateBtn'), resetButton: $('resetBtn'), buttonText: $('buttonText'), state: $('matchState'), minute: $('minute'), period: $('periodLabel'), progress: $('matchProgress'), homeScore: $('homeScore'), awayScore: $('awayScore'), events: $('eventsList'), eventCount: $('eventCount'), homeStyle: $('homeStyle'), awayStyle: $('awayStyle')
};
