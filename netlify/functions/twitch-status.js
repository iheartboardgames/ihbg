exports.handler = async () => {
  const CLIENT_ID  = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const CHANNEL    = 'heartboardgames';

  try {
    // 1. App access token (Client Credentials flow)
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );
    const { access_token } = await tokenRes.json();
    const headers = {
      'Client-Id': CLIENT_ID,
      'Authorization': `Bearer ${access_token}`
    };

    // 2. Get broadcaster ID
    const userRes  = await fetch(`https://api.twitch.tv/helix/users?login=${CHANNEL}`, { headers });
    const userData = await userRes.json();
    const user     = userData.data?.[0];
    const uid      = user?.id;

    // 3. Check if live
    const streamRes  = await fetch(`https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`, { headers });
    const streamData = await streamRes.json();
    const stream     = streamData.data?.[0] ?? null;
    const isLive     = !!stream;

    // 4. Follower count
    let followerCount = null;
    if (uid) {
      const followRes  = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${uid}`, { headers });
      const followData = await followRes.json();
      followerCount    = followData.total ?? null;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        isLive,
        followerCount,
        title:    stream?.title     ?? null,
        gameName: stream?.game_name ?? null
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
