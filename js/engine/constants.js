// Numbers and names that come straight from the rulebook.
// Change them here and the whole game follows.

export const RACING_CAMELS = ['blue', 'yellow', 'green', 'red', 'purple'];
export const CRAZY_CAMELS = ['white', 'black'];
export const ALL_CAMELS = [...RACING_CAMELS, ...CRAZY_CAMELS];

/** The pyramid holds one die per racing camel plus the grey "crazy" die. */
export const DICE = [...RACING_CAMELS, 'grey'];
/** A leg ends when 5 of the 6 dice have been revealed. */
export const DICE_PER_LEG = 5;
export const PYRAMID_TICKETS = 5;

/** Race track spaces are numbered 1..16. The finish line sits after 16. */
export const TRACK_SPACES = 16;

/** Betting tickets per colour, top of the stack first (5, then 3, then 2 and 2). */
export const LEG_TICKET_VALUES = [5, 3, 2, 2];

/** Overall winner/loser cards: 1st correct card 8, then 5, 3, 2, and 1 for everyone after. */
export const FINISH_PAYOUTS = [8, 5, 3, 2];
export const FINISH_PAYOUT_LATE = 1;
export const FINISH_PENALTY = 1;

export const STARTING_COINS = 3;

/** The box says 3–8 players; 2 is allowed here for practice (e.g. you vs. a bot). */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
/** "Additional rules in games with 6 or more players": betting partnerships. */
export const PARTNERSHIP_MIN_PLAYERS = 6;

export const CAMEL_LABELS = {
  blue: 'Blue',
  yellow: 'Yellow',
  green: 'Green',
  red: 'Red',
  purple: 'Purple',
  white: 'White',
  black: 'Black',
};

export const isRacing = (camel) => RACING_CAMELS.includes(camel);
export const isCrazy = (camel) => camel === 'white' || camel === 'black';
