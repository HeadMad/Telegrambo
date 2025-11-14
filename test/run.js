const action = process.argv[2];

if (action) 
  import( `./actions/${action}.js` );

