export default extensionMatch;

function extensionMatch(bot, matchSeparator = '::') {
  return function (matchString, matchHandler) {

    const matchChain = matchString.split(matchSeparator);
    const event = matchChain[0] ? matchChain[0] : null;

    bot.on(event, (eventContext, eventName) => {
      //////////////// check match
      return checkMatchChein(matchChain, matchHandler)(eventContext, eventName, eventContext.update);
      //////////////// end check match
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
  const regExpr = /^\/(.+)\/([imus]{0,4})?$/;

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

      } else if (regExpr.test(prop)) {
        const [_, pattern, flags] = prop.match(regExpr);
        const RE = new RegExp(pattern, flags);
        if (!RE.test(match))
          return null;

      } else if (String(match) != prop) {
        return null;
      } // if match !== prop
    } // for prop in props
    return matchHandler(eventContext, eventName, match);
  };
}