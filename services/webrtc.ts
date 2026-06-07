// services/webrtc.ts

import {
  RTCPeerConnection,
} from 'react-native-webrtc';

export const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

export const createPeerConnection = () =>
  new RTCPeerConnection(configuration);