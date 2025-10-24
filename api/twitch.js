// La función se exporta para que Vercel la reconozca como un endpoint de API
export default async function (req, res) {
    // ⚠️ ATENCIÓN: Estas claves se inyectarán de forma segura desde Vercel
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID; 
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
    const TWITCH_USERNAME = process.env.TWITCH_USERNAME;

    if (!CLIENT_ID || !CLIENT_SECRET || !TWITCH_USERNAME) {
        return res.status(500).json({ error: "Missing Twitch API credentials or username in Vercel Environment Variables." });
    }

    try {
        // PASO 1: Obtener el Access Token (Token de Portador) de Twitch
        const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST',
        });
        const tokenData = await tokenResponse.json();
        const ACCESS_TOKEN = tokenData.access_token;

        if (!ACCESS_TOKEN) {
            return res.status(500).json({ error: "Could not retrieve Access Token from Twitch." });
        }

        // PASO 2: Usar el Token para verificar el estado del Stream (Helix API)
        const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
        });
        const streamData = await streamResponse.json();

        // Verificar si el stream está activo (la propiedad 'data' tiene elementos)
        const isLive = streamData.data && streamData.data.length > 0;
        const streamTitle = isLive ? streamData.data[0].title : null;

        // Devuelve el resultado al frontend
        res.status(200).json({
            isLive: isLive,
            title: streamTitle,
        });

    } catch (error) {
        console.error("Twitch API Error:", error);
        res.status(500).json({ error: "Internal server error during Twitch API call." });
    }
}