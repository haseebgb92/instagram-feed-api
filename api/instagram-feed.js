// /api/instagram-feed.js
// Vercel API endpoint for Instagram feed scraping

module.exports = async function handler(req, res) {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse query params (for diagnostics/testing)
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const test = urlObj.searchParams.get('test');
    if (test === '1') {
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).json([
        {
          image: 'https://via.placeholder.com/400x400/8BC0B2/FFFFFF?text=Instagram+Post',
          caption: 'Test mode: fallback data',
          link: `https://www.instagram.com/cubsgulf/`,
          likes: 0,
          comments: 0
        }
      ]);
    }
  } catch (_) {}

  const username = 'cubsgulf';
  
  try {
    // Method 1: Try Instagram's newer API structure
    let posts = await tryNewInstagramAPI(username);
    
    if (!posts || posts.length === 0) {
      // Method 2: Try scraping the profile page
      posts = await tryScrapeProfilePage(username);
    }
    
    if (!posts || posts.length === 0) {
      // Method 3: Try alternative data extraction
      posts = await tryAlternativeExtraction(username);
    }

    if (posts && posts.length > 0) {
      // Transform and return posts
      const transformedPosts = posts.slice(0, 9).map(post => ({
        image: post.image || post.thumbnail_src || post.display_url || post.media_url,
        caption: post.caption || post.text || '',
        link: post.link || `https://www.instagram.com/p/${post.shortcode}/`,
        likes: post.likes || post.edge_liked_by?.count || 0,
        comments: post.comments || post.edge_media_to_comment?.count || 0
      }));

      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).json(transformedPosts);
    }

    throw new Error('No posts found from any method');

  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    
    // Return error response with fallback data
    res.status(500).json([
      {
        image: 'https://via.placeholder.com/400x400/8BC0B2/FFFFFF?text=Follow+Us',
        caption: 'Follow us on Instagram @cubsgulf',
        link: `https://www.instagram.com/${username}/`,
        likes: 0,
        comments: 0
      },
      {
        image: 'https://via.placeholder.com/400x400/EDC821/FFFFFF?text=Stay+Inspired',
        caption: 'Stay inspired with our latest posts',
        link: `https://www.instagram.com/${username}/`,
        likes: 0,
        comments: 0
      },
      {
        image: 'https://via.placeholder.com/400x400/E4405F/FFFFFF?text=Discover+More',
        caption: 'Discover amazing products and stories',
        link: `https://www.instagram.com/${username}/`,
        likes: 0,
        comments: 0
      }
    ]);
  }
};

// Method 1: Try Instagram's newer API structure
async function tryNewInstagramAPI(username) {
  try {
    const response = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest',
        'X-IG-App-ID': '936619743392459',
        'X-IG-WWW-Claim': '0',
        'X-ASBD-ID': '129477',
        'X-CSRFToken': 'missing',
        'X-Instagram-AJAX': '1006632969',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
        return data.graphql.user.edge_owner_to_timeline_media.edges.map(edge => edge.node);
      }
    }
  } catch (error) {
    console.log('New API method failed:', error.message);
  }
  return null;
}

// Method 2: Try scraping the profile page
async function tryScrapeProfilePage(username) {
  try {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Try multiple data extraction patterns
    const patterns = [
      /window\._sharedData\s*=\s*({.+?});/,
      /<script type="text\/javascript">window\._sharedData = ({.+?});<\/script>/,
      /window\.__additionalDataLoaded\s*\(\s*[^,]+,\s*({.+?})\s*\)/,
      /"entry_data":\s*({.+?})\s*,\s*"hostname"/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const json = JSON.parse(match[1]);
          if (json.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
            return json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges.map(edge => edge.node);
          }
        } catch (parseError) {
          console.log('Pattern parse failed:', parseError.message);
        }
      }
    }
  } catch (error) {
    console.log('Profile scraping failed:', error.message);
  }
  return null;
}

// Method 3: Try alternative data extraction
async function tryAlternativeExtraction(username) {
  try {
    // Try Instagram's JSON-LD structured data
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();
      
      // Look for JSON-LD structured data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">({.+?})<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.mainEntityofPage && jsonLd.mainEntityofPage.interactionStatistic) {
            // Extract basic profile info and create placeholder posts
            return [
              {
                image: `https://www.instagram.com/${username}/media/?size=l`,
                caption: `Follow @${username} on Instagram`,
                link: `https://www.instagram.com/${username}/`,
                likes: 0,
                comments: 0
              }
            ];
          }
        } catch (parseError) {
          console.log('JSON-LD parse failed:', parseError.message);
        }
      }
    }
  } catch (error) {
    console.log('Alternative extraction failed:', error.message);
  }
  return null;
}
