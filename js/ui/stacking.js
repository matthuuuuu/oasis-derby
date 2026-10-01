// How camels look when they pile up on one space.
// Each style decides, for the camel `index` places up a pile of `count`:
//   pose  — 'stand' or 'sit' (lying down)
//   face  — which way it looks: 'rule' (its racing direction), or relative to the bottom camel
//   dx    — sideways shift (in camel widths)
//   rise  — how far above the bottom camel it sits (in camel heights, before squeezing)
//
// tools/stack-options.html shows the styles side by side.

/**
 * The pile style the game uses (one of the STACK_STYLES keys). 'staircase': every coloured
 * camel faces the way the race runs (crazy camels face backwards), and each camel up the
 * pile sits a little further back so all the heads peek out in front.
 */
export const STACK_STYLE = 'staircase';

/** Camel width as a fraction of the board width (0.137 = the first 0.145, shrunk 10%, then grown 5%). */
export const CAMEL_SIZE = 0.137;

export const STACK_STYLES = {
  lazy: 'Lazy pile: the bottom camel stands, the rest lie down, each looking the other way from the one below',
  tower: 'Camel tower: everyone stands on each other’s backs, alternating directions',
  snuggle: 'Snuggle heap: everyone lies down in a cosy pile, alternating directions',
  staircase: 'Piggyback staircase: the bottom camel stands, the rest lie in a diagonal line, all facing forward',
};

// Top of the head, as a fraction of the sprite box, for each pose.
const HEAD_TOP = { stand: 0.03, sit: 0.186 };

function slotShape(style, index, count) {
  switch (style) {
    case 'tower':
      return {
        pose: 'stand',
        face: index === 0 ? 'rule' : index % 2 ? 'flip' : 'same',
        dx: index === 0 ? 0 : 0.1,
        rises: [0.58, 0.58],
      };
    case 'snuggle':
      return {
        pose: 'sit',
        face: index === 0 ? 'rule' : index % 2 ? 'flip' : 'same',
        dx: index === 0 ? 0 : 0.2,
        rises: [0.4, 0.4],
      };
    case 'staircase':
      return {
        pose: index === 0 ? 'stand' : 'sit',
        face: 'rule',
        stair: 0.17, // each camel up the pile sits this much further back
        rises: [0.6, 0.36],
      };
    case 'lazy':
    default:
      // the directions alternate going up the pile: the 2nd camel looks the other way from the
      // bottom camel, the 3rd the same way as it, the 4th the other way again…
      return {
        pose: index === 0 ? 'stand' : 'sit',
        face: index === 0 ? 'rule' : index % 2 ? 'flip' : 'same',
        dx: index === 0 ? 0 : 0.2,
        rises: [0.6, 0.4],
      };
  }
}

/**
 * Where camel `index` of a `count` pile goes.
 *   ruleLeft(i)  — does camel i face left by the rules (racing direction)?
 *   env: { camW, camH, room, forwardLeft } — room = how far (px) the bottom camel's sprite
 *        top may be lifted before the pile hits its ceiling; forwardLeft = the race runs
 *        leftwards on this space (the staircase steps back away from that direction).
 * Returns { dx, rise, pose, faceLeft } in pixels.
 */
export function pileSlot(style, index, count, ruleLeft, env) {
  const shape = slotShape(style, index, count);
  const bottomLeft = ruleLeft(0);

  // which way it looks
  let faceLeft;
  if (shape.face === 'rule') faceLeft = ruleLeft(index);
  else if (shape.face === 'same') faceLeft = bottomLeft;
  else if (shape.face === 'flip') faceLeft = !bottomLeft;
  else faceLeft = shape.face === 'left';

  // sideways: toward where it looks (so its head pokes out), or a staircase
  let dx = 0;
  if (shape.stair) {
    // step back, away from the way the race runs (so a crazy camel at the bottom doesn't flip it)
    const forwardLeft = env.forwardLeft ?? bottomLeft;
    const back = forwardLeft ? 1 : -1;
    dx = (index - (count - 1) / 2) * shape.stair * back;
  } else if (shape.dx) {
    dx = (faceLeft ? -1 : 1) * shape.dx;
  }

  // up: natural rise, squeezed evenly when the pile would be too tall
  const riseAt = (i) => (i === 0 ? 0 : shape.rises[0] + (i - 1) * shape.rises[1]);
  const topPose = slotShape(style, count - 1, count).pose;
  const natural = riseAt(count - 1) * env.camH;
  const maxRise = env.room + HEAD_TOP[topPose] * env.camH;
  const squeeze = natural > 0 ? Math.min(1, maxRise / natural) : 1;

  return {
    dx: dx * env.camW,
    rise: riseAt(index) * env.camH * squeeze,
    pose: shape.pose,
    faceLeft,
  };
}
