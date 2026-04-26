const replace = require('replace-in-file');
const options = {
  files: __dirname + '/bundler.js',
  from: /require/g,
  to: 'window.require',
};
(async ()  => {
    await replace(options)
    const fs = require('fs');
    // destination.txt will be created or overwritten by default.
    fs.copyFile(__dirname + '/bundler.js', __dirname + '/../src/app/data/app/services/bundler.js', (err) => {
      if (err) throw err;
      console.log('bundler.js was copied to application directory');
    });

})()


