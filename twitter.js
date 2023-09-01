import Twit from 'twit';

// Initialize Twitter client
const T = new Twit({
  consumer_key: 'oQ4KzkEntAGKl6LxoNnJPoZL8',         // Your Consumer Key
  consumer_secret: 'wKefqeT9muG9ns66dxjXA0lVKih7CoLimZHo8xgfnsvNAy6gkV',      // Your Consumer Secret
  access_token: '1351256899933663233-P5z2bkmi9WLK8WPKFUB5xEuH7uAJSJ',         // Your Access Token
  access_token_secret: 'QQkeCt5JbIPXbn2gPk9qz4qbMZtEAhyULbL9csTlhRGrx',  // Your Access Token Secret
});
//bearer_token: 'AAAAAAAAAAAAAAAAAAAAABbUpgEAAAAAZ%2BtGnmuEeMGlVjmt1yqOmJ2rwxk%3DmOW6urQYOKcbEzZPlJL3jGccUkFWp9uk6xy0TpqSWHfBrn8Fzl',

// Define the user and criteria
const twitterAccount = 'BBCBreaking';  // Replace with the Twitter account you want to check
const minLikes = 1000;

// Fetch recent tweets
T.get('statuses/user_timeline', { screen_name: twitterAccount, count: 10 }, function(err, data, response) {
  if (err) {
    console.error('Error fetching tweets:', err);
    return;
  }

  for (const tweet of data) {
    if (tweet.favorite_count >= minLikes) {
      // Your code to send a WhatsApp message
      // You can use tweet.text to get the content of the tweet
      // and tweet.favorite_count to get the number of likes
      console.log(`Breaking news tweet with ${tweet.favorite_count} likes: ${tweet.text}`);
      // Here you can call a function to send this as a message to WhatsApp users
    }
  }
});
