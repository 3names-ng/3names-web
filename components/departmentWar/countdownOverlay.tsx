import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Easing } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';

interface CountdownOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export function CountdownOverlay({ visible, onComplete }: CountdownOverlayProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      return;
    }

    const nums = ['3', '2', '1', 'GO!'];
    let i = 0;

    const runNext = () => {
      if (i >= nums.length) {
        onComplete?.();
        return;
      }

      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          i++;
          setTimeout(runNext, 50);
        });
      });
    };

    runNext();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <ThemedText
            style={{
              color: '#fff',
              fontSize: 120,
              fontWeight: '900',
              textAlign: 'center',
            }}
          >
            3
          </ThemedText>
        </Animated.View>

        <ThemedText
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 16,
            fontWeight: '600',
            marginTop: 30,
          }}
        >
          Get Ready!
        </ThemedText>
      </View>
    </Modal>
  );
}
