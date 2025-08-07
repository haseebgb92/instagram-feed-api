# Instagram Feed API for Shopify

A Vercel API that fetches Instagram posts and displays them in your Shopify theme.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/instagram-feed-api)

## 📁 Project Structure

```
├── api/
│   └── instagram-feed.js    # Main API endpoint
├── package.json             # Dependencies
├── vercel.json             # Vercel configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/instagram-feed-api.git
cd instagram-feed-api
```

### 2. Deploy to Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

### 3. Get Your API URL

After deployment, you'll get a URL like:
```
https://your-app-name.vercel.app/api/instagram-feed
```

## 🎯 Usage

### API Endpoint

**GET** `/api/instagram-feed`

**Response:**
```json
[
  {
    "image": "https://instagram.com/image.jpg",
    "caption": "Post caption",
    "link": "https://instagram.com/p/shortcode/",
    "likes": 123,
    "comments": 45
  }
]
```

### Shopify Integration

1. **Update your Instagram feed section** with the provided `sections/instagram-feed.liquid`
2. **Set the API URL** in your section settings to your Vercel endpoint
3. **Test the integration**

## ⚙️ Configuration

### Change Instagram Handle

Edit `api/instagram-feed.js`:
```javascript
const username = 'your-instagram-handle'; // Replace with your handle
```

### Customize Response

Modify the transformation in `api/instagram-feed.js`:
```javascript
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
```

## 🎨 Features

- ✅ **Real Instagram Data**: Fetches actual posts from Instagram
- ✅ **Error Handling**: Graceful fallbacks if API fails
- ✅ **CORS Enabled**: Works with Shopify themes
- ✅ **Caching**: 1-hour cache for performance
- ✅ **Responsive**: Works on all devices

## 🐛 Troubleshooting

### Common Issues

1. **API Not Working**:
   - Check Vercel deployment status
   - Verify Instagram handle is correct
   - Test API URL directly in browser

2. **No Posts Loading**:
   - Ensure Instagram account is public
   - Check browser console for errors
   - Verify data structure hasn't changed

3. **CORS Issues**:
   - Check `vercel.json` headers configuration
   - Ensure API URL is correct in Shopify

### Debug Mode

Add console logging to test:
```bash
curl https://your-app-name.vercel.app/api/instagram-feed
```

## 📞 Support

If you need help:
1. Check the [Issues](https://github.com/yourusername/instagram-feed-api/issues) page
2. Verify your Vercel deployment is working
3. Test the API endpoint directly
4. Ensure Instagram handle is correct and public

## 📄 License

MIT License - feel free to use this project for your own needs!

## 🔄 Updates

- **v1.0**: Initial release with basic Instagram feed
- **Future**: Enhanced error handling, more customization options
