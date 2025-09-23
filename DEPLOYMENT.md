# Verbyflow Signaling Server Deployment Guide

This guide provides detailed instructions for deploying the Verbyflow signaling server to Render.com.

## Why Render.com?

1. **Free Tier Available**: Render provides a free tier for web services that's sufficient for testing and small-scale deployments.
2. **Easy Deployment**: Deployment is straightforward with automatic detection of Node.js projects.
3. **Continuous Deployment**: Automatically deploys when you push changes to your GitHub repository.
4. **HTTPS by Default**: All Render services automatically get HTTPS with Let's Encrypt certificates.

## Prerequisites

1. A GitHub account
2. A Render.com account (sign up at [render.com](https://render.com))
3. Your verbyflow-signaling code pushed to a GitHub repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository includes:
- `package.json` with all dependencies
- `src/index.js` as the entry point
- `render.yaml` configuration file (already included)

### 2. Deploy to Render

1. **Sign in to Render.com** and go to your dashboard.

2. **Create a new Web Service**:
   - Click the "New +" button in the top right
   - Select "Web Service"

3. **Connect your GitHub repository**:
   - Select the GitHub repository containing your signaling server
   - If you haven't connected GitHub to Render yet, you'll be prompted to do so

4. **Configure the service**:
   - Render should automatically detect your Node.js app
   - Verify the following settings:
     - **Name**: `verbyflow-signaling` (or choose your own)
     - **Environment**: `Node`
     - **Region**: Choose the region closest to your users
     - **Branch**: `main` (or your default branch)
     - **Build Command**: `npm install`
     - **Start Command**: `node src/index.js`
     - **Plan**: Free (or choose another plan if needed)

5. **Environment Variables**:
   - By default, the server will use the values from render.yaml
   - You can override these if needed:
     - `NODE_ENV`: `production`
     - `PORT`: `3000` (Render will automatically set the correct port)

6. **Create Web Service**:
   - Click "Create Web Service"
   - Render will start building and deploying your service

### 3. Monitor Deployment

1. **Watch the build logs**:
   - Render will show build logs in real-time
   - Wait for the build to complete and the service to start

2. **Check Service Status**:
   - Once deployed, you'll see a green "Live" status
   - Note your service URL (e.g., `https://verbyflow-signaling.onrender.com`)

3. **Verify the deployment**:
   - Test the health endpoint by visiting `https://your-service-url.onrender.com/health`
   - You should see a response: `{"status":"ok"}`

### 4. Update Your Android App

1. Open `C:\Users\PC\AndroidStudioProjects\Verbyflow\app\src\main\java\com\example\verbyflow\data\repository\CallRepositoryImpl.kt`

2. Update the `SIGNALING_SERVER_URL` constant with your Render service URL:
   ```kotlin
   private const val SIGNALING_SERVER_URL = "https://your-service-url.onrender.com" 
   ```

3. Rebuild your Android app

## Troubleshooting

### Server Issues

1. **Service fails to start**:
   - Check the logs for any errors
   - Verify your `package.json` has all required dependencies
   - Make sure the start command is correct

2. **Socket.IO connection issues**:
   - Verify CORS settings in `src/index.js`
   - Check that your client is using the correct URL with protocol (https://)

### Android Client Issues

1. **Can't connect to server**:
   - Check that the URL is correct and includes the protocol (https://)
   - Make sure your Android app has internet permission in the manifest
   - Verify you're not using localhost or 127.0.0.1 in the URL

2. **Signaling messages not being received**:
   - Check the logs on both server and client
   - Ensure user IDs are being correctly registered
   - Verify that meeting IDs are correctly passed

## Scaling Considerations

For a production deployment:

1. **Upgrade to a paid plan** for better performance and no sleeps
2. **Add TURN servers** for reliable NAT traversal
3. **Implement authentication** to prevent unauthorized access
4. **Set up monitoring** to track service health and usage

## Local Testing

Before deploying to Render, test your server locally:

```bash
# Clone the repository
git clone https://github.com/yourusername/verbyflow-signaling.git

# Change to the project directory
cd verbyflow-signaling

# Install dependencies
npm install

# Start the server
npm start
```

Then update your Android app to use your local server URL (e.g., `http://192.168.1.100:3000`).

## Need Help?

If you encounter any issues with the deployment:
1. Check the server logs in the Render dashboard
2. Review the Android app logs for connection errors
3. Verify your network configuration and firewall settings
