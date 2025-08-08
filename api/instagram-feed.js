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

  const username = 'cubsgulf'; // Replace with your Instagram handle
  const url = `https://www.instagram.com/${username}/`;

  try {
    // Fetch Instagram page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      console.error('Fetch failed', { status: response.status, statusText: response.statusText });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract JSON data from Instagram page
    const jsonMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
    
    if (!jsonMatch) {
      // Fallback: try to find alternative data structure
      const alternativeMatch = html.match(/<script type="text\/javascript">window\._sharedData = ({.+?});<\/script>/);
      
      if (!alternativeMatch) {
        throw new Error('Could not extract Instagram data');
      }
      
      var json = JSON.parse(alternativeMatch[1]);
    } else {
      var json = JSON.parse(jsonMatch[1]);
    }

    // Extract posts from the JSON data
    let posts = [];
    
    try {
      // Try different possible data structures
      if (json.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
        posts = json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges;
      } else if (json.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_web_discover_media?.edges) {
        posts = json.entry_data.ProfilePage[0].graphql.user.edge_web_discover_media.edges;
      } else {
        throw new Error('No posts found in Instagram data');
      }

      // Transform posts to our format
      const transformedPosts = posts.slice(0, 9).map(post => {
        const node = post.node;
        return {
          image: node.thumbnail_src || node.display_url || node.media_url,
          caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
          link: `https://www.instagram.com/p/${node.shortcode}/`,
          likes: node.edge_liked_by?.count || 0,
          comments: node.edge_media_to_comment?.count || 0
        };
      });

      // Set cache headers (1 hour)
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      res.status(200).json(transformedPosts);

    } catch (parseError) {
      console.error('Error parsing Instagram data:', parseError);
      
      // Return fallback data if parsing fails
      res.status(200).json([
        {
          image: 'https://via.placeholder.com/400x400/8BC0B2/FFFFFF?text=Instagram+Post',
          caption: 'Follow us on Instagram @cubsgulf',
          link: `https://www.instagram.com/${username}/`,
          likes: 0,
          comments: 0
        },
        {
          image: 'https://via.placeholder.com/400x400/EDC821/FFFFFF?text=Instagram+Post',
          caption: 'Stay inspired with our latest posts',
          link: `https://www.instagram.com/${username}/`,
          likes: 0,
          comments: 0
        },
        {
          image: 'https://via.placeholder.com/400x400/E4405F/FFFFFF?text=Instagram+Post',
          caption: 'Discover amazing products and stories',
          link: `https://www.instagram.com/${username}/`,
          likes: 0,
          comments: 0
        }
      ]);
    }

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
}
