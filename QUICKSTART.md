# QUICK START GUIDE

## 1️⃣ Install Dependencies
Run this command in the project folder:
```bash
npm install
```

## 2️⃣ Add Your Map Image
Copy your map image to this folder and name it `map.png`

## 3️⃣ Get API Key
1. Visit: https://console.anthropic.com/
2. Sign in or create account
3. Go to "API Keys" section
4. Create new key and copy it

## 4️⃣ Start the Server
```bash
npm start
```

You should see:
```
✅ Real Estate Platform running on http://localhost:3000

Open your browser and go to: http://localhost:3000
```

## 5️⃣ Open in Browser
Go to: **http://localhost:3000**

## 6️⃣ Paste API Key
When prompted, paste your Claude API key

## 7️⃣ Test It
- Type an address like "Amsterdam, Netherlands" or "Berlin, Germany"
- Press Enter
- Watch Claude analyze the property data!

---

### Troubleshooting

**"npm: command not found"**
→ You need to install Node.js from https://nodejs.org/

**"Cannot find module 'express'"**
→ Run `npm install` first

**"Cannot load map.png"**
→ Make sure your map image is named exactly `map.png` and is in the same folder as `index.html`

**"API Error"**
→ Check your API key is correct at https://console.anthropic.com/

**"Cannot connect to localhost:3000"**
→ Make sure the server is running (you should see the ✅ message in your terminal)

---

That's it! You're ready to demo to your hackathon judges 🚀

