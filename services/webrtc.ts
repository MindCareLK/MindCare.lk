// services/webrtc.ts

import {
  RTCPeerConnection,
} from './webrtc-shim';

export const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

export const createPeerConnection = () =>
  new RTCPeerConnection(configuration);