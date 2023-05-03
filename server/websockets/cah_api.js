const got = require('got');
// got is used to make API requests from the server

/* These two methods will make requests to a public CAH API
https://www.restagainsthumanity.com/2.0/
*/

// for now, only takig cards from the base expansion as
// the request takes a considerable amount of time
const loadBlack = async () => {
  const data = await got('https://restagainsthumanity.com/api/v2/cards', {
    searchParams: {
      packs: 'CAH Base Set,CAH: First Expansion,CAH: Second Expansion,CAH: Third Expansion',
      pick: 1,
      color: 'black',
      includePackNames: false,
    },
  }).json();

  return data;
};

const loadWhite = async () => {
  const data = await got(
    'https://restagainsthumanity.com/api/v2/cards',
    {
      searchParams: {
        packs: 'CAH Base Set,CAH: First Expansion,CAH: Second Expansion,CAH: Third Expansion',
        color: 'white',
        includePackNames: false,
      },
    },
  ).json();

  return data;
};

module.exports = {
  loadBlack,
  loadWhite,
};
