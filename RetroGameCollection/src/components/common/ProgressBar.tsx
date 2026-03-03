import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

interface Props {
  owned: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ProgressRing({
  owned,
  total,
  size = 64,
  strokeWidth = 8,
  color = '#6366f1',
}: Props) {
  const pct = total > 0 ? Math.min(owned / total, 1) : 0;
  const pctDisplay = Math.round(pct * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — starts from 12 o'clock */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      {/* Centered label */}
      <View style={[StyleSheet.absoluteFill, styles.labelContainer]}>
        <Text style={[styles.pct, {color, fontSize: size * 0.22}]}>
          {pctDisplay}%
        </Text>
        <Text style={[styles.sub, {fontSize: size * 0.14}]}>
          {owned}/{total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    fontWeight: '800',
    lineHeight: undefined,
  },
  sub: {
    color: '#64748b',
    marginTop: 1,
  },
});
