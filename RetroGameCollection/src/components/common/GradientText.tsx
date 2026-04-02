import React from 'react';
import {Text, StyleSheet} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  children: string;
  style?: object;
  colors?: string[];
  locations?: number[];
  start?: {x: number; y: number};
  end?: {x: number; y: number};
};

export default function GradientText({
  children,
  style,
  colors = ['#FF1B8D', '#A855F7', '#5B45DC'],
  locations = [0, 0.25, 1],
  start = {x: 0, y: 0.5},
  end = {x: 1, y: 0.5},
}: Props) {
  return (
    <MaskedView maskElement={<Text style={[styles.text, style]}>{children}</Text>}>
      <LinearGradient colors={colors} locations={locations} start={start} end={end}>
        <Text style={[styles.text, style, styles.transparent]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
  },
  transparent: {
    opacity: 0,
  },
});
