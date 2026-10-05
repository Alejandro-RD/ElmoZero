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
        // Las credenciales van en el cuerpo del POST, no en la URL, para que no queden en logs
        const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials',
            }),
        });

        if (!tokenResponse.ok) {
            console.error(`Twitch token request failed: HTTP ${tokenResponse.status}`, await tokenResponse.text());
            return res.status(502).json({ error: "Could not retrieve Access Token from Twitch." });
        }

        const tokenData = await tokenResponse.json();
        const ACCESS_TOKEN = tokenData.access_token;

        if (!ACCESS_TOKEN) {
            return res.status(502).json({ error: "Could not retrieve Access Token from Twitch." });
        }

        // PASO 2: Usar el Token para verificar el estado del Stream (Helix API)
        const streamUrl = `https://api.twitch.tv/helix/streams?${new URLSearchParams({ user_login: TWITCH_USERNAME })}`;
        const streamResponse = await fetch(streamUrl, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
        });

        // Sin esta comprobación, un 401/429 de Twitch se mostraría como "Offline"
        if (!streamResponse.ok) {
            console.error(`Twitch streams request failed: HTTP ${streamResponse.status}`, await streamResponse.text());
            return res.status(502).json({ error: "Twitch API returned an error while checking stream status." });
        }

        const streamData = await streamResponse.json();

        // Verificar si el stream está activo (la propiedad 'data' tiene elementos)
        const isLive = Array.isArray(streamData.data) && streamData.data.length > 0;
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
