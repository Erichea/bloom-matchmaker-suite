# RooCode Supernova Model Configuration Guide

## Overview
This guide explains how to configure RooCode in VS Code to use the Supernova free model as your default AI provider.

## Step 1: Create VS Code Settings File

Since RooCode configuration is stored in VS Code settings, you'll need to create a `.vscode/settings.json` file in your project directory.

## Step 2: Add RooCode Configuration

Add the following configuration to your `.vscode/settings.json` file:

```json
{
  "roocode.model.default": "supernova",
  "roocode.models.supernova": {
    "provider": "supernova",
    "model": "supernova-free",
    "apiKey": "YOUR_SUPERNOVA_API_KEY",
    "baseUrl": "https://api.supernova.ai/v1",
    "temperature": 0.7,
    "maxTokens": 4096
  }
}
```

## Step 3: Get Your Supernova API Key

1. Visit the Supernova website (https://supernova.ai)
2. Sign up for a free account
3. Navigate to your API settings
4. Generate a new API key
5. Replace `YOUR_SUPERNOVA_API_KEY` in the configuration above with your actual API key

## Step 4: Alternative Configuration Methods

### Method A: VS Code Settings UI
1. Open VS Code
2. Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
3. Search for "roocode"
4. Find the "RooCode: Model Default" setting
5. Set it to "supernova"
6. Configure the Supernova model settings in the RooCode extension settings

### Method B: Command Palette
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "RooCode: Configure Model"
3. Select "supernova" from the list
4. Follow the prompts to enter your API key

## Step 5: Verify Configuration

1. Restart VS Code
2. Open the RooCode panel (usually in the sidebar)
3. Check that the model selector shows "supernova" as the default
4. Try a simple prompt to test the connection

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Ensure your API key is valid and active
   - Check if you have exceeded the free tier limits
   - Verify the API key is correctly copied without extra spaces

2. **Model Not Available**
   - Ensure you have the latest version of RooCode
   - Check if Supernova is supported in your region
   - Verify the model name is correct ("supernova-free")

3. **Connection Issues**
   - Check your internet connection
   - Verify the base URL is correct
   - Check if any firewall is blocking the connection

### Debug Mode

Enable debug mode in RooCode settings to see detailed logs:
```json
{
  "roocode.debug.enabled": true,
  "roocode.debug.level": "verbose"
}
```

## Model Configuration Options

You can customize the Supernova model behavior with these additional settings:

```json
{
  "roocode.models.supernova": {
    "provider": "supernova",
    "model": "supernova-free",
    "apiKey": "YOUR_SUPERNOVA_API_KEY",
    "baseUrl": "https://api.supernova.ai/v1",
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 0.9,
    "frequencyPenalty": 0,
    "presencePenalty": 0,
    "timeout": 30000
  }
}
```

## Security Notes

- Never commit your API key to version control
- Consider using environment variables for API keys in production
- Regularly rotate your API keys for security
- Monitor your API usage to stay within free tier limits

## Next Steps

Once configured, you can:
- Use Supernova for code generation and assistance
- Create custom prompts specific to your project
- Set up project-specific configurations
- Explore advanced features like context-aware suggestions