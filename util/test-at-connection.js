const { testConnection } = require('./africasTalking');

console.log('Starting Africa\'s Talking connection test...');

testConnection()
  .then(result => {
    if (result.success) {
      console.log('✅ Connection test successful!');
      console.log('Account info:', JSON.stringify(result.data, null, 2));
      process.exit(0);
    } else {
      console.error('❌ Connection test failed!');
      console.error('Error message:', result.message);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error during connection test:');
    console.error(error);
    process.exit(1);
  });
