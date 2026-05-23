// import {
//   mediaDevices,
//   MediaStream,
// } from 'react-native-webrtc';

// export const getLocalStream = async (): Promise<MediaStream> => {
//   try {
//     const stream = await mediaDevices.getUserMedia({
//       audio: true,
//       video: true,
//     });

//     return stream;
//   } catch (error) {
//     console.log('Error getting media stream:', error);
//     throw error;
//   }
// };

import { Platform } from 'react-native';

let mediaDevices: any = null;

if (Platform.OS !== 'web') {
  mediaDevices = require('react-native-webrtc').mediaDevices;
}

export const getLocalStream = async () => {
  if (Platform.OS === 'web') {
    console.log('WebRTC not supported on web.');
    return null;
  }

  try {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    return stream;
  } catch (error) {
    console.log('Error getting media stream:', error);
    throw error;
  }
};