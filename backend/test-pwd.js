const { verify } = require('@node-rs/argon2');
const hash = '$argon2id$v=19$m=19456,t=2,p=1$iQOHQsydLw3QwT4BW9Aq1A$f0LHQsgffFzTDcbyXrmAMopROvKTEc3SiTUhYFBre9o';

async function test() {
  const isMatch1 = await verify(hash, 'Admin123!');
  const isMatch2 = await verify(hash, 'Admin123! ');
  console.log('Match Admin123! :', isMatch1);
  console.log('Match Admin123!  :', isMatch2);
}
test();
