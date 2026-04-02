import React from 'react';
import {Image, StyleSheet} from 'react-native';

export default function ScreenLogo({scale = 1}: {scale?: number}) {
  return (
    <Image
      source={require('../../../assets/rgc-logo.png')}
      style={[styles.logo, {width: 90 * scale, height: 40 * scale}]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    marginLeft: -8,
  },
});
