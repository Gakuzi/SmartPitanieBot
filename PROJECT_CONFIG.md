# Project Configuration

## Google Cloud Project

- **Project Name**: Klimov Evgeny
- **Project Number**: 914830127018
- **Project ID**: klimov-evgeny

## Clasp Configuration

This project uses `clasp` to manage Google Apps Script projects.

- **Login**: `clasp login`
- **Clone**: `clasp clone <scriptId>`
- **Push**: `clasp push`
- **Watch**: `clasp push --watch` or `./start_clasp_watch.sh`

## Workflow

1.  **Make changes** to the local files.
2.  **Push changes** to the Google Apps Script project using `clasp push`.
3.  **Manually run functions** from the Google Apps Script editor.
4.  **Check logs** in the Google Apps Script editor to verify the results.

## Deployment

1.  In the Apps Script editor, click **Deploy** > **New deployment**.
2.  Set the type to **Web app**.
3.  Set **Execute as** to **Me**.
4.  Set **Who has access** to **Anyone**.
5.  Click **Deploy**.
6.  Copy the **Web app URL**.
7.  Run the `deployAndUpdateWebhook()` function from `0_setup.js` to set the webhook.

## Useful Functions for Debugging

- `deployAndUpdateWebhook()` - Deploys and updates the webhook.
- `checkBotStatus()` - Checks the bot's status.
- `setupProjectInfrastructure()` - Sets up the project infrastructure.
- `setupTelegramToken()` - Sets the Telegram token.
- `setupGeminiApiKey()` - Sets the Gemini API key.