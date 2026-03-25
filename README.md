# Real Estate Developer Hackathon Platform

An interactive web platform for real estate developers to analyze properties using Claude AI for comprehensive real estate data lookup.

## Setup

### 1. Add Your Map Image
Place your map image in this directory and name it `map.jpg` (or update the filename in `style.css` if using a different name).

```bash
# Example: copy your map image
cp /path/to/your/map.jpg ./map.jpg
```

### 2. Get Your Claude API Key
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Create an account or log in
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key (you'll paste it when you first open the website)

### 3. Run Locally
Simply open `index.html` in your web browser:

```bash
# macOS
open index.html

# Or just double-click the file in Finder/Explorer
```

The app will prompt you for your Claude API key on first load, then store it in your browser's local storage.

## How It Works

1. **Landing Page**: Shows your map as background with an address input box
2. **Enter Address**: Type a property address in Dutch or German and press Enter
3. **AI Analysis**: Claude analyzes the address and retrieves:
   - Kadaster registration info (Netherlands)
   - WOZ-waarde (property valuation)
   - Zoning rights and building permits
   - Surface area and plot information
   - Environmental restrictions
   - Legal considerations
4. **Results Page**: Displays comprehensive real estate data
5. **New Search**: Click "New Search" to try another address

## Features

- ✅ Interactive address lookup
- ✅ Claude AI-powered real estate research
- ✅ Clean, professional UI
- ✅ Mobile responsive
- ✅ Browser-based (no installation needed)

## Future Enhancements

- [ ] File upload for architect offers and expert reports
- [ ] Advanced filtering and analysis
- [ ] Cost estimation tools
- [ ] Comparison tools for multiple properties
- [ ] Export functionality

## Notes

- Your API key is stored locally in your browser and never sent to any server except Anthropic
- Works with Dutch and German addresses
- For production use, consider a backend API proxy for security

## Support

For issues with the Claude API, visit [Anthropic's documentation](https://docs.anthropic.com/).

---

Built for hackathon - ready to expand with more features!
