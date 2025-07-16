export default onMatch;


/**
 * Creates a callback function to handle a specific match.
 *
 * @param {object} bot - The bot instance.
 * @param {string} matchSeparator - The separator used to split the match string into an array.
 * @return {function} A callback function that handles the match.
 */
function onMatch( matchSeparator = '::') {
  return (bot) => (matchString, matchHandler) => {

    const matchChain = matchString.split(matchSeparator);
    const event = matchChain[0] ? matchChain[0] : null;

    bot.on(event, (event, eventName) => {
      return checkMatchChein(matchChain, matchHandler)(event, eventName, event.update);
    });
  };
}

/**
 * Creates a match handler function that processes events based on a given match chain.
 *
 * @param {Array} matchChain - The chain of properties to match against in the event data.
 * @param {function} matchHandler - The event handler function to be called when a match is found.
 * @return {function} The created match handler function.
 */
function checkMatchChein(matchChain, matchHandler) {
  const IsregExpr = /^\/(.+)\/([imus]{0,4})?$/;

  return (eventContext, eventName, match) => {

    for (let p = 0; p < matchChain.length; p++) {
      const prop = matchChain[p];

      const matchType = match.constructor.name;

      if (matchType === 'Object') {
        if (prop in match)
          match = match[prop];

        else if (prop !== '')
          return null;

      } else if (matchType === 'Array') {
        const slicedMatchChain = matchChain.slice(p);
        const result = match.map(match =>
          checkMatchChein(slicedMatchChain, matchHandler)(eventContext, eventName, match)
        );
        return result.filter(res => res).flat();

      } else if (prop === '') {
        continue;

      } else if (IsregExpr.test(prop)) {
        const [_, pattern, flags] = prop.match(IsregExpr);
        const RE = new RegExp(pattern, flags);
        match = match.match(RE);
        if (!match)
          return null;

      } else if (String(match) != prop) {
        return null;
      } // if match !== prop
    } // for prop in props
    return matchHandler(eventContext, match, eventName);
  };
}