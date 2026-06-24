// services/webrtc.ts

import {
  RTCPeerConnection,
} from './webrtc-shim';

const turnUsername = process.env.EXPO_PUBLIC_TURN_USERNAME;
const turnPassword = process.env.EXPO_PUBLIC_TURN_PASSWORD;

export const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun.cloudflare.com:3478',
        'turn:turn.cloudflare.com:3478?transport=udp',
        'turn:turn.cloudflare.com:3478?transport=tcp',
        'turns:turn.cloudflare.com:5349?transport=tcp'
      ],
      username: turnUsername,
      credential: turnPassword,
    }
  ],
};

export const fetchIceServers = async (): Promise<any[]> => {
  const cloudflareTokenId = process.env.EXPO_PUBLIC_CLOUDFLARE_TOKEN_ID;
  const cloudflareApiToken = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;

  if (cloudflareTokenId && cloudflareApiToken) {
    try {
      const response = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${cloudflareTokenId}/credentials/generate-ice-servers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ttl: 86400 }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Cloudflare TURN credentials: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.iceServers) {
        return data.iceServers;
      }
      return configuration.iceServers;
    } catch (error) {
      console.warn('Failed to fetch dynamic Cloudflare ICE servers, using static fallback:', error);
      return configuration.iceServers;
    }
  }

  return configuration.iceServers;
};

export const createPeerConnection = () =>
  new RTCPeerConnection(configuration);