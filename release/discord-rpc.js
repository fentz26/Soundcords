// Corrected Discord Rich Presence Implementation using discord-rpc
// To use this, you need to install the discord-rpc library: npm install discord-rpc

const rpc = require('discord-rpc');

class DiscordRPC {
    constructor() {
        // You should not hardcode client ID and user ID like this in a final product
        // Replace with your actual client ID
        this.clientId = 'YOUR_CLIENT_ID';
        this.client = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            console.log('Initializing Discord Rich Presence...');
            
            // Create a new RPC client instance
            this.client = new rpc.Client({ transport: 'ipc' });

            // Handle the ready event when the client connects to Discord
            this.client.on('ready', () => {
                this.isConnected = true;
                console.log('Discord Rich Presence initialized and connected successfully.');
            });

            // Log in with the client ID
            await this.client.login({ clientId: this.clientId });

            return this.isConnected;
        } catch (error) {
            console.error('Failed to initialize Discord Rich Presence:', error);
            this.isConnected = false;
            return false;
        }
    }

    async updatePresence(presenceData) {
        if (!this.isConnected) {
            console.warn('Discord Rich Presence not connected');
            return false;
        }

        try {
            // Format the presence data for Discord RPC
            const formattedData = this.formatPresenceData(presenceData);
            
            console.log('Sending Discord Presence Update:', formattedData);
            
            // Use the RPC client's setActivity method to update the presence
            await this.client.setActivity(formattedData);
            
            return true;
        } catch (error) {
            console.error('Failed to update Discord presence:', error);
            return false;
        }
    }

    async clearPresence() {
        if (!this.isConnected) {
            return false;
        }

        try {
            console.log('Clearing Discord Presence');
            await this.client.clearActivity();
            return true;
        } catch (error) {
            console.error('Failed to clear Discord presence:', error);
            return false;
        }
    }
    
    // Updated formatPresenceData to include 'type' and to be more flexible
    formatPresenceData(data) {
        return {
            details: data.details,
            state: data.state,
            largeImageKey: data.largeImageKey,
            largeImageText: data.largeImageText,
            smallImageKey: data.smallImageKey,
            smallImageText: data.smallImageText,
            startTimestamp: data.startTimestamp,
            endTimestamp: data.endTimestamp, // Added endTimestamp
            // The key difference for "Listening to" vs "Playing"
            type: data.type || 'PLAYING', 
            buttons: data.buttons || []
        };
    }

    // Helper method to create presence data from song info
    createSongPresence(songInfo, language = 'en') {
        const translations = this.getTranslations(language);
        
        // Calculate timestamps based on song duration
        const startTimestamp = Date.now();
        const endTimestamp = startTimestamp + (songInfo.durationInSeconds * 1000);

        return {
            // Set the activity type to 'LISTENING'
            type: 'LISTENING', 
            // Main line shows the artist name (what appears after "Listening to")
            details: songInfo.artist,
            // Second line shows the full song title
            state: `${songInfo.artist} - ${songInfo.title}`,
            largeImageKey: songInfo.albumArtKey || 'soundcloud', // Use song-specific art if available
            largeImageText: songInfo.albumArtText || 'SoundCloud',
            smallImageKey: 'soundcloud',
            smallImageText: 'SoundCloud',
            startTimestamp,
            endTimestamp, // Include end timestamp for the progress bar
            buttons: [
                {
                    label: translations.viewOnSoundCloud,
                    url: songInfo.url
                }
            ]
        };
    }

    getTranslations(language) {
        // ... (translations remain the same)
        const translations = {
            en: {
                listeningTo: 'Listening to',
                onSoundCloud: 'by', // Changed this to be more grammatically correct
                viewOnSoundCloud: 'View on SoundCloud'
            },
            ja: {
                listeningTo: '聴いている',
                onSoundCloud: 'の',
                viewOnSoundCloud: 'SoundCloudで見る'
            }
        };

        return translations[language] || translations.en;
    }

    // The sendToDiscordTab method is removed because it's not the correct way
    // to communicate with Discord for Rich Presence.
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordRPC;
} else {
    window.DiscordRPC = DiscordRPC;
}